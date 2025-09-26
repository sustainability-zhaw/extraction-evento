# Extraction pipeline for Evento

Imports modules from the ZHAW Evento Web search.

## Configuration

The following can be configured by providing a JSON file at `/etc/app/config.json`.
An additional JSON file is read from `/etc/app/secrets.json` that can be used for sensitive information.

- `dbHost` - GraphQL host. Defaults to `localhost:8080`.
- `batchInterval` - Time in seconds between fetching modules. Defualts to `86400` (24h).
- `batchSize` - Process the fetched project list in batches. Defaults to `100`. Zero or negative value disables batching.
- `batchInterval` - Time in seconds to wait before processing the next batch. Defaults to `300` (5 min). Ignored if batch size is zero or negative value.
- `mqHost` - RabbitMQ host. Defaults to `mq`.
- `mqUser` - RabbitMQ user. Defaults to `guest`.
- `mqPass` - RabbitMQ password. Defaults to `guest`.
- `mqExchange` - RabbitMQ exchange name, Defaults to `zhaw-km`.
- `logLevel` - Log level for tracing and debugging. Defaults to `error`.
