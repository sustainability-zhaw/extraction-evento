import { createApp, defineEventHandler, getQuery, toNodeListener } from "h3";
import { listen } from "listhen";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { existsSync } from "node:fs";

const app = createApp();

app.use(
  defineEventHandler(async (event) => {
    const outputDir = fileURLToPath(new URL("../.generated", import.meta.url));
    const query = getQuery(event);
    if ("IDAnlass" in query) {
      const path = join(outputDir, `modules/${query["IDAnlass"]}.html`);
      if (existsSync(path)) return readFile(path, { encoding: "utf-8" });
      else new Response(null, { status: 404 });
    }
    return readFile(join(outputDir, "search.html"), { encoding: "utf-8" });
  })
);

listen(toNodeListener(app), { hostname: "0.0.0.0" });
