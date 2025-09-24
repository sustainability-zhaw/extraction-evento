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
  const content = await fetch(eventoSearchURL).then((resp) => resp.text());

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

async function importModule(url) {
  const content = await fetch(createPrintURL(url)).then((resp) => resp.text());
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
