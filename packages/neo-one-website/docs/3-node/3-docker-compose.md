---
slug: node-compose
title: Docker Compose
---

In this section we will cover how to deploy a NEO•ONE Node to a swarm using Docker Compose.

If you haven't already be sure to check out the local docker development [section](/docs/node-docker) to familiarize yourself with the container we are deploying. Additionally, brushing up on [Docker-Compose](https://docs.docker.com/compose/) would also be worthwhile.

---

[[toc]]

## Getting Started

We'll be deploying with docker-compose using `swarm` mode. The `docker-compose.yml` below is a very similar deployment to what we saw in the [kubernetes](/docs/node-kubernetes) section. We create a persistent named-volume for each container started and run our backup and sync configuration.

```yml
## docker-compose.yml
version: "3.1"
services:
  node:
    image: neoonesuite/node
    command: [
      "--node.rpcURLs=http://seed6.ngd.network:10332",
      "--node.rpcURLs=https://seed1.red4sec.com:10332"
    ]
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: "1"
          memory: 4G
      restart_policy:
        condition: on-failure
    volumes:
      - node-data:/root/.local/share/neo-one
volumes:
  node-data:
```

To start a docker swarm and apply our deployment you can run

```bash
docker swarm init
docker stack deploy -c docker-compose.yml test
```

You can then check this service is running with

```bash
docker service ls
```

Finally, to shutdown this deployment kill the swarm using

```bash
docker swarm leave --force
```

::: warning

Note

If you delete the service created by docker, you will still need to cleanup the volume, `node-data` in our example, that is created on startup. You can find the volume using `docker volume ls` and remove it using `docker volume rm <volume-name>`.

:::

## Logs

You can list all of the containers being run using

```bash
docker container ls
```

then to see its logs you can either attach directly to the container (we recommend this only for testing startup as SIGINT will kill the container) with

```bash
docker attach <container_id>
```

or check its most recent logs

```bash
docker logs <container_id>
```

## Health Checks

You can add health checks to a docker swarm similar to a kubernetes setup. After enabling live checks in the NEO•ONE Node configuration we can enable a probe by adding the following to our compose configuration:

```yml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:<node-port>/live_health_check']
  interval: 1m30s
  timeout: 10s
  retries: 3
  start_period: 45s
```

See [docker documentation](https://docs.docker.com/compose/compose-file/#healthcheck) for more information about health check configurations.
