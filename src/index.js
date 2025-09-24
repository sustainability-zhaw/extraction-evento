import { loadConfig } from "./config.js";
import { initialize as initLogger } from "./logger.js"
import { run as runImporter } from "./importer.js";

await loadConfig();
initLogger();
runImporter();
