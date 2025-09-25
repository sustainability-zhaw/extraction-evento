import { getConfig, loadConfig } from "./config.js";
import { init as initLogger } from "service_logger"
import { run as runImporter } from "./importer.js";

await loadConfig();
const config = getConfig();

initLogger({ level: config.logLevel });
runImporter();
