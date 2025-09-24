import { createConsola } from "consola";
import { getConfig } from "./config.js";

export function initialize() {
  const config = getConfig();
  const consola = createConsola({
    level: config.logLevel,
  });
  consola.wrapConsole();
}
