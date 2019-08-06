---
slug: node-docker
title: Local Docker Development
---

In this section we will cover how to deploy a NEO•ONE Node locally using the NEO•ONE Node Docker image.

If you are unfamiliar with Docker or do not have a version installed locally visit their [getting started](https://www.docker.com/get-started) page.

---

[[toc]]

---

## Requirements

- [Docker](https://www.docker.com/get-started)
  - Minimum: **_at least_** 2GB Memory, 1cpu, and 50GB Storage allocated
  - Recommended: 4GB Memory, 2cpu, and 60GB+ Storage allocated
    (if you plan to deploy to a cluster you will need this for _each_ pod/container)

## Getting Started

[![Docker Repository on Quay](https://quay.io/repository/neoone/node/status 'Docker Repository on Quay')](https://quay.io/repository/neoone/node)

NEO•ONE uses [quay](https://quay.io/) to automatically build the docker image every time a new version is published.

After you have installed Docker, run the following in a terminal:

```bash
docker pull quay.io/neoone/node
docker run quay.io/neoone/node
```

Voila! You should now be running the most recent NEO•ONE Node in a local docker container and will see logs to confirm it has started.

## Configuring

There are **several** ways to configure the node; any [rc](https://github.com/dominictarr/rc#rc) type configuration is accepted. as an example we can set the `logger` level of the node to _trace_ using either:

```bash
docker run quay.io/neoone/node --environment.logger.level=trace
```

or through environment variables

```bash
docker run -e neo_one_node_environment__logger__level=trace quay.io/neoone/node
```

Additionally you have the option of creating a `config` (no extension) file and mounting it directly to the container. By default the node will look for a config at `/etc/neo_one_node`.

So if we have a config

```bash
## /path/to/config
{
  "environment": {
    "logger": {
      "level": "trace"
    }
  }
}
```

located at `/path/to/config` we could mount this to the default location as:

```bash
docker run -v /path/to:/etc/neo_one_node/ quay.io/neoone/node
```

(Note that you must mount the **entire** folder the config file is in)

After running any the above you should see more logging on startup! For more configuration options see the [configuration reference](/docs/node-configuration).

## Storage

Similarly to how we can mount a configuration folder to the container for local testing we can also mount a folder for storing the blockchain data our node will collect. By default, the node will use `/root/.local/share/neo_one_node` as its storage. We can mount a local folder `/path/to/node-data/` using

```bash
docker run -v /path/to/node-data:/root/.local/share/neo_one_node quay.io/neoone/node
```

This is helpful when testing locally as you won't have to re-sync your node-data on every restart.

## Port Publishing

By default the container will be able to access external resources, such as connecting and syncing with other relay nodes after setting `node.rpcURLs`.

If you would like your local Docker container to be able to send its own data, you'll need to `publish` the port using docker commands. As an example we can enable node metrics using the following command:

```bash
docker run -p 8001:8001 quay.io/neoone/node --environment.telemetry.port=8001
```

Upon visiting `localhost:8001/metrics` you should now see the node-metrics page.

::: warning

Note

By default metrics are **disabled** so you _must_ include the `--environment.telemetry.port=8001` argument or provide a telemetry port through other means of configuration (see above).

:::

## Examples

The following configurations should be a solid jumping off point for working with the node. For each of the three examples here we will also show how to implement them using [Docker Compose](/docs/node-compose/).

In all three examples we will use

```bash
docker run -v /node-config/:/etc/neo_one_node/ -v /node-data/:/root/.local/share/neo_one_node quay.io/neoone/node
```

to mount our configuration and local data file before starting the node. Go ahead and create the two folders `node-config` and `node-data` if you would like to follow along.

### Sync

To sync your node with other nodes on the network, you must specify them using the `node.rpcURLs` configuration setting. A list of current mainnet nodes can be found at: http://monitor.cityofzion.io/

```bash
#/node-config/config
{
  "node": {
    "rpcURLs": [
      "http://seed6.ngd.network:10332",
      "http://node1.nyc3.bridgeprotocol.io:10332"
    ]
  }
}
```

Now, if we apply this configuration we can begin to request block information from other nodes. After saving this to `node-config/config`, run the command listed above.

Upon successfully starting the node, you should begin to see `relay_block` events!

::: warning

Note

Its worth mentioning that syncing the entire blockchain can take a **very** long time. We recommend `restoring` to a recent backup (described below) and _then_ syncing.

:::

### Restore

To download a backup of the most recent blockchain data and extract it you can configure the node using NEO•ONE's public backup hosted on Google Cloud. We'll specify bucket information and mark the `restore` option as true.

```bash
## /node-config/config
{
  "backup": {
    "restore": true,
    "provider": {
      "gcloud": {
        "projectID": "neotracker-172901",
        "bucket": "bucket-1.neo-one.io",
        "prefix": "node_0",
        "maxSizeBytes": 419430400
      }
    }
  }
}
```

This tells the node where we want to restore from. Assuming there is an available google-cloud bucket to restore from (there will be for our example) it will download and extract the blockchain data to our defined `node-data` folder. This process can take multiple hours depending on network speeds as a fully synced backup is ~16GB in size.

To restore **_and_** sync simply combine the above configurations.
