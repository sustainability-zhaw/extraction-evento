import config from "./config.js";
import rascal from "rascal";

export default await rascal.BrokerAsPromised.create(
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