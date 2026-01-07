import { defu } from "defu";
import { pathToFileURL } from "node:url";

const configPromises = ["/etc/app/config.json", "/etc/app/secrets.json"].map((path) =>
  import(pathToFileURL(path).toString(), { with: { type: "json" } }).then((mod) => mod.default)
);

const configs = (await Promise.allSettled(configPromises))
  .filter((p) => p.status === "fulfilled")
  .map((p) => p.value);

export default defu(...configs, {
  logLevel: "error",
  dbHost: "localhost:8080",
  eventoSearchUrl: "https://eventoweb.zhaw.ch/Evt_Pages/SuchResultat.aspx?node=c594e3e5-cd9a-4204-9a61-de1e43ccb7b0&Tabkey=WebTab_ModuleSuchenZHAW",
  batchSize: 100,
  batchInterval: 300, // 5min
  importInterval: 3600, // 1h
  importDates: ['02-01', '09-01'], // format: month-day (2 digits)
  mqHost: "mq",
  mqUser: "extraction-evento",
  mqPass: "guest",
  mqExchange: "zhaw-km",
});
