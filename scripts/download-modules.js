import { parseHTML } from "linkedom";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, resolve } from "node:url";

const outputDir = fileURLToPath(new URL("../.generated", import.meta.url));
if (!existsSync(outputDir)) {
  if (!mkdirSync(outputDir)) throw "Error creating output directory.";
}

const eventoURL = new URL(
  "https://eventoweb.zhaw.ch/Evt_Pages/SuchResultat.aspx?node=c594e3e5-cd9a-4204-9a61-de1e43ccb7b0&Tabkey=WebTab_ModuleSuchenZHAW&IdLanguage=1&clearcache=true&Print=true"
);

const content = await fetch(eventoURL).then(resp => resp.text());
writeFileSync(join(outputDir, "search.html"), content, { encoding: "utf-8" });

const dom = new parseHTML(content);
const elements = dom.document.querySelectorAll(
  "tr.result-row > td:nth-of-type(1) > span:nth-of-type(1) > a:nth-of-type(2)"
);

const urls = [];
for (const element of elements) {
  const url = resolve(eventoURL.toString(), element.getAttribute("href"));
  urls.push(url);
}

while(urls.length > 0) {
    const batch = urls.splice(0, 5);
    await Promise.allSettled(batch.map(async (url) => {
        const _url = new URL(`${url}&IdLanguage=1&clearcache=true&Print=true`);
        const content = await fetch(_url).then(resp => resp.text());
        await writeFile(join(outputDir, `${_url.searchParams.get("IDAnlass")}.html`), content, { encoding: "utf-8" })
    }));
    console.log(`Count: ${urls.length}`);
}
