import rascal from "rascal";
import { getConfig } from "./config.js";

/**
 * @type {import("rascal").BrokerAsPromised | undefined}
 */
let broker;

export async function init() {
  const config = getConfig();
  broker = await rascal.BrokerAsPromised.create(
    rascal.withDefaultConfig({
      vhosts: {
        "/": {
          exchanges: [
            {
              name: config.mqExchange,
              options: {
                durable: false,
              },
            },
          ],
          connection: {
            hostname: config.mqHost,
            user: config.mqUser,
            password: config.mqPass,
          },
        },
      },
      publications: {
        infoObject: {
          routingKey: "importer.object",
          exchange: config.mqExchange,
        },
      },
    })
  );
}

export function getBroker() {
  if (!broker) throw "Message broker not initialized. Call init() first.";
  return broker;
}
