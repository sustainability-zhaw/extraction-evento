import { createApp, defineEventHandler, getQuery, toNodeListener } from "h3";
import { listen } from "listhen";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const app = createApp();

app.use(
  defineEventHandler(async (event) => {
    const outputDir = fileURLToPath(new URL("../.generated", import.meta.url));
    const query = getQuery(event);
    if ("IDAnlass" in query) {
      return readFile(join(outputDir, `modules/${query["IDAnlass"]}.html`), { encoding: "utf-8" });
    }
    return readFile(join(outputDir, "search.html"), { encoding: "utf-8" });
  })
);

listen(toNodeListener(app), { hostname: "0.0.0.0" });
