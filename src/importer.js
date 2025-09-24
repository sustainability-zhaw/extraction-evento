import { JSDOM } from "jsdom";
import { setTimeout } from "node:timers/promises";
import { getConfig } from "./config.js";

function createPrintURL(url) {
  const _url = url instanceof URL ? url : new URL(url);
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
  const dom = new JSDOM(content);
  const elements = dom.window.document.querySelectorAll(
    "tr.result-row > td:nth-of-type(1) > span:nth-of-type(1) > a:nth-of-type(2)"
  );

  const urls = [];
  for (const element of elements) {
    const url = new URL(element.getAttribute("href"), eventoSearchURL);
    urls.push(url);
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
  const xpathResult = document.evaluate(
    "//i[contains(text(), 'Version: ')]",
    document,
    null,
    dom.window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  if (xpathResult.snapshotLength > 0) {
    const element = xpathResult.snapshotItem(0);
    const result = /^Version: (?<version>\d+\.\d+)/.exec(element.textContent);
    if (result.groups?.version) {
      return result.groups.version;
    }
  }
}

function parseAbstract(document) {
  return Array.from(document.querySelectorAll("table tbody tr td:first-child")).reduce((acc, element) => {
    if(element.textContent === "" || /beschrieb|inhalt/i.test(element.textContent)) {
      acc += element.nextElementSibling?.textContent ?? "";
    }
    return acc;
  }, "");
}

async function importModule(url) {
  url = createPrintURL(url);
  const response = await fetch(url);

  if (response.status !== 200)
      throw `Responded with ${response.status}`;

  const content = await response.text();
  const dom = new JSDOM(content);
  const document = dom.window.document;

  const labels = Array.from(document.querySelectorAll(".detail-label"));

  const eventoId = url.searchParams.get("IDAnlass");
  const { moduleId, departement, level } = parseModuleId(labels);
  const title = labels.find(element => element.textContent === "Bezeichnung")?.nextElementSibling?.textContent;
  const organizer = labels.find(element => element.textContent === "Veranstalter")?.nextElementSibling?.textContent;
  const credits = labels.find(element => element.textContent === "Credits")?.nextElementSibling?.textContent;
  const version = parseVersion(dom, document);
  const abstract = parseAbstract(document);

  // TODO: upsert infoObject

  console.log({
    eventoId,
    moduleId,
    departement,
    level,
    title,
    organizer,
    credits,
    version,
    abstract
  })
}

export async function run() {
  const config = getConfig();

  while (true) {
    try {
      console.info("Getting module urls");
      const urls = await getModuleURLs();

      if (urls.length === 0) {
        console.warn("No module urls found!");
      }

      console.info(`Importing ${urls.length} modules`);

      while (urls.length) {
        const batch = urls.splice(0, config.batchSize);
        const results = await Promise.allSettled(batch.map((url) => importModule(url)));
        
        results.forEach((result, index) => {
          if (result.status === "rejected")
            console.warn(`Failed to import module ${batch[index]} reason: ${result.reason}`);
        });

        console.debug(`Urls remaining: ${urls.length}`);
      }
    } catch (err) {
      console.error(err);
    }

    console.info(`Finished import`)
    console.info(`Waiting for ${config.importInterval}s until next run`)

    await setTimeout(config.importInterval * 1000);
  }
}
