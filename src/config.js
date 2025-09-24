import { defu } from "defu";
import { pathToFileURL } from "node:url";

let config =  {
  logLevel: 4,
  dbHost: "localhost:8080",
  eventoSearchUrl: "http://localhost:3000",//"https://eventoweb.zhaw.ch/Evt_Pages/SuchResultat.aspx?node=c594e3e5-cd9a-4204-9a61-de1e43ccb7b0&Tabkey=WebTab_ModuleSuchenZHAW",
  batchSize: 5,
  importInterval: 86400, // 24h
  mqHost: "mq",
  mqUser: "extraction-evento",
  mqPass: "guest",
  mqExchange: "zhaw-km",
  mqHeartbeat: 6000,
};

const configPaths = ["/etc/app/config.json", "/etc/app/secrets.json"];

export async function loadConfig() {
  const promises = configPaths.map((path) => import(pathToFileURL(path).toString()));
  const configs = (await Promise.allSettled(promises))
    .filter((p) => p.status === "fulfilled")
    .map((p) => p.value);

  config = defu(...configs, config);
}

export function getConfig() {
  return config;
}
