import { parseHTML } from "linkedom";
import { setTimeout } from "node:timers/promises";
import { getConfig } from "./config.js";
import { request as gqlRequest, gql } from "graphql-request";
import { get as getLogger } from "service_logger";

const logger = getLogger("importer");

function createPrintURL(url) {
  const _url = new URL(url);
  _url.searchParams.set("IdLanguage", "1");
  _url.searchParams.set("clearcache", "true");
  _url.searchParams.set("Print", "true");
  return _url;
}

async function getModuleURLs() {
  const config = getConfig();
  const eventoSearchURL = createPrintURL(config.eventoSearchUrl);
  const response = await fetch(eventoSearchURL);

  if (response.status !== 200) 
    throw `Responded with ${response.status}`;

  const content = await response.text();
  const dom = parseHTML(content);
  const elements = dom.document.querySelectorAll(
    "tr.result-row > td:nth-of-type(1) > span:nth-of-type(1) > a:nth-of-type(2)"
  );

  const urls = [];
  for (const element of elements) {
    const url = new URL(element.getAttribute("href"), eventoSearchURL);
    urls.push(url.toString());
  }

  return urls;
}

function parseModuleId(labels) {
  const moduleId = labels.find(element => element.textContent === "Nr.")?.nextElementSibling?.textContent;
  let departement;
  let level;

  if (moduleId) {
    const values = moduleId.split(".");
    if (values.length > 0) departement = values[0].toUpperCase();
    if (values.length > 1) level = values[1];
  }

  return { moduleId, departement, level }
}

function parseVersion(dom, document) {
  const element = document.querySelectorAll("i").find(el => el.textContent.trim().startsWith("Version: "))
  if (element) {
    const result = /^Version: (?<version>\d+\.\d+)/.exec(element.textContent);
    if (result.groups?.version) return result.groups.version;
  }
}

function parseAbstract(document) {
  let abstract = "";
  const tables = document.querySelectorAll("td.topic-inhalt table");

  for (const table of tables) {
    const firstColCells = table.querySelectorAll('tbody tr td:first-child');

    for (let i = 0; i < firstColCells.length; i++) {
      const labelCell = firstColCells[i];

      if(/beschrieb|inhalt/i.test(labelCell.textContent)) {
        abstract += labelCell.nextElementSibling?.textContent.trim() ?? "";

        // If the cell below is empty (no label) it is likely that the info is split over multiple rows.
        while(i < firstColCells.length - 1) {
          const labelCellBelow = firstColCells[i+1];
          if (labelCellBelow.textContent?.trim() !== "") break;
          abstract += labelCellBelow.nextElementSibling?.textContent.trim() ?? "";
          i++;
        }
      }
    }
  }

  return abstract;
}

async function importModule(url) {
  const config = getConfig();
  const moduleURL = createPrintURL(url);
  const eventoId = moduleURL.searchParams.get("IDAnlass");
  const response = await fetch(moduleURL);

  if (response.status !== 200)
      throw `Responded with ${response.status}`;

  const content = await response.text();
  const dom = parseHTML(content);
  const document = dom.document;

  const labels = document.querySelectorAll(".detail-label");

  const { moduleId, departement, level } = parseModuleId(labels);
  const title = labels.find(element => element.textContent === "Bezeichnung")?.nextElementSibling?.textContent;
  const organizer = labels.find(element => element.textContent === "Veranstalter")?.nextElementSibling?.textContent;
  const credits = labels.find(element => element.textContent === "Credits")?.nextElementSibling?.textContent;
  const version = parseVersion(dom, document);
  const abstract = parseAbstract(document);

  const infoObject = {
    link: url,
    category: { name: "modules" },
    language: "de",
    dateUpdate: Date.now()
  };

  if (title) infoObject.title = title;
  if (abstract) infoObject.abstract = abstract;
  if (departement) infoObject.departement = { id: `department_${departement}` };

  logger.debug(infoObject)

  await gqlRequest(
    `http://${config.dbHost}/graphql`,
    gql`
      mutation ($infoObject: [AddInfoObjectInput!]!) {
        addInfoObject(input: $infoObject, upsert: true) {
          infoObject { 
            link
          }
        }
      }
    `,
    { infoObject }
  );

  // TODO: add link to queue
}

export async function run() {
  const config = getConfig();

  while (true) {
    try {
      logger.info("Getting module urls");
      const urls = await getModuleURLs();

      if (urls.length === 0) {
        logger.warning("No module urls found!");
      }

      logger.info(`Importing ${urls.length} modules`);

      while (urls.length) {
        const batch = urls.splice(0, config.batchSize);
        const results = await Promise.allSettled(batch.map((url) => importModule(url)));
        
        results.forEach((result, index) => {
          if (result.status === "rejected")
            logger.warning(`Failed to import module ${batch[index]} reason: ${result.reason}`);
        });

        logger.debug(`Urls remaining: ${urls.length}`);
      }
    } catch (err) {
      logger.error(err);
    }

    logger.info(`Finished import`)
    logger.info(`Waiting for ${config.importInterval}s until next run`)

    await setTimeout(config.importInterval * 1000);
  }
}
