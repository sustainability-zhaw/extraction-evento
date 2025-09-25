import { init as initLogger } from "service_logger";
import { getConfig } from "./config.js";

export function init() {
  const config = getConfig();
  initLogger({ level: config.logLevel });
}
