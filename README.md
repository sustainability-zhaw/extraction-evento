# extraction-evento
Extraction Pipeline for Evento


## Development

A development environment with dgraph, sample data, and dgraph ratel is provided via `docker-compose-local.yaml`.

To start the environment run the following command: 

```bash
docker compose -f docker-compose-local.yaml up  --build --force-recreate --remove-orphans
```

The launch takes approx. 30 seconds. After that period an initialised dgraph database is exposed via `localhost:8080`.
