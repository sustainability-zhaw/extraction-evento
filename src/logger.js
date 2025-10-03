import config from "./config.js";
import { init } from "service_logger";

init({ level: config.logLevel });
export { get as getLogger } from "service_logger";
