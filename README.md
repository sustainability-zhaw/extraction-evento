# Extraction pipeline for Evento

Imports modules from the ZHAW Evento Web search.

## Configuration

The following can be configured by providing a JSON file at `/etc/app/config.json`.
An additional JSON file is read from `/etc/app/secrets.json` that can be used for sensitive information.

- `eventoSearchUrl` - Evento Web search url. Defaults to [`Evento Web ZHAW`](https://eventoweb.zhaw.ch/Evt_Pages/SuchResultat.aspx?node=c594e3e5-cd9a-4204-9a61-de1e43ccb7b0&Tabkey=WebTab_ModuleSuchenZHAW)
- `dbHost` - GraphQL host. Defaults to `localhost:8080`.
- `importInterval` - Time in seconds to wait before running the import. Defualts to `3600` (1h).
- `importDates` - Dates on which to run the import. Defaults to `['02-01', '09-01']` (format: MM-DD).
- `batchSize` - Process the fetched module list in batches. Defaults to `100`. Zero or negative value disables batching.
- `batchInterval` - Time in seconds to wait before processing the next batch. Defaults to `300` (5 min). Ignored if batch size is zero or negative value.
- `mqHost` - RabbitMQ host. Defaults to `mq`.
- `mqUser` - RabbitMQ user. Defaults to `guest`.
- `mqPass` - RabbitMQ password. Defaults to `guest`.
- `mqExchange` - RabbitMQ exchange name, Defaults to `zhaw-km`.
- `logLevel` - Log level for tracing and debugging. Defaults to `error`.
