import { loadConfig } from "./config.js";
import { run as runImporter } from "./importer.js";
import { init as initLogger } from "./logger.js";
import { init as initMessageQueue } from "./message-queue.js";

await loadConfig();
initLogger();
await initMessageQueue();
await runImporter();
