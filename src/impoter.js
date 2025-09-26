import { gql, request } from "graphql-request";
import { parseHTML } from "linkedom";
import { setTimeout } from "node:timers/promises";
import config from "./config.js";
import { getLogger } from "./logger.js";
import mq from "./mq.js";

const logger = getLogger("importer");

function createPrintURL(url) {
  const _url = new URL(url);
  _url.searchParams.set("IdLanguage", "1");
  _url.searchParams.set("clearcache", "true");
  _url.searchParams.set("Print", "true");
  return _url;
}

async function fetchModuleURLList() {
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
  let department;
  let level;

  if (moduleId) {
    const values = moduleId.split(".");
    if (values.length > 0) department = values[0].toUpperCase();
    if (values.length > 1) level = values[1];
  }

  return { moduleId, department, level }
}

function parseVersion(document) {
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

      if (/beschrieb|inhalt/i.test(labelCell.textContent)) {
        abstract += labelCell.nextElementSibling?.textContent.trim() ?? "";

        // If the cell below is empty (no label) it is likely that the info is split over multiple rows.
        while (i < firstColCells.length - 1) {
          const labelCellBelow = firstColCells[i + 1];
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
  const moduleURL = createPrintURL(url);
  const eventoId = moduleURL.searchParams.get("IDAnlass");
  const response = await fetch(moduleURL);

  if (response.status !== 200)
    throw `Responded with ${response.status}`;

  const content = await response.text();
  const dom = parseHTML(content);
  const document = dom.document;

  const labels = document.querySelectorAll(".detail-label");

  const { moduleId, department, level } = parseModuleId(labels);
  const title = labels.find(element => element.textContent === "Bezeichnung")?.nextElementSibling?.textContent;
  const organizer = labels.find(element => element.textContent === "Veranstalter")?.nextElementSibling?.textContent;
  const credits = labels.find(element => element.textContent === "Credits")?.nextElementSibling?.textContent;
  const version = parseVersion(document);
  const abstract = parseAbstract(document);

  const infoObject = {
    link: url,
    category: { name: "modules" },
    language: "de",
    dateUpdate: Date.now()
  };

  if (title) infoObject.title = title;
  if (abstract) infoObject.abstract = abstract;
  if (department) infoObject.departments = [{ id: `department_${department}` }];

  await request(
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

  await mq.publish("infoObject", { link: url });
}

export async function run() {
  while (true) {
    try {
      logger.info("Fetching module urls");
      const urls = await fetchModuleURLList();

      if (urls.length === 0) {
        logger.warning("No module urls found!");
      }

      logger.info(`Importing ${urls.length} modules`);

      while (urls.length) {
        const batch = urls.splice(0, config.batchSize);

        for (const url of batch) {
          try { await importModule(url); }
          catch (err) { console.error(err); }
        }

        logger.info(`Waiting for ${config.batchInterval}s before processing the next ${config.batchSize} modules`);
        logger.debug(`${urls.length} modules.remaining`);

        await setTimeout(config.batchInterval * 1000);
      }
    } catch (err) {
      logger.error(err);
    }

    logger.info(`Finished import`)
    logger.info(`Waiting for ${config.importInterval}s before the next run`)

    await setTimeout(config.importInterval * 1000);
  }
}
