---
slug: node-configuration
title: Configuration Reference
---

This section will serve as a reference for the NEO•ONE Node's many configuration options.

---

[[toc]]

---

## Environment

```bash
...
{
  "environment": {
    "dataPath?": string,
    "chainFile?": string,
    "dumpChainFile?": string,
    "monitor?": string,
    "haltOnSync?": boolean,
    "levelDownOptions?": ???,
    "telemetry?": {
      "port": number
    }
  }
}
...
```

### dataPath

*defaults to the data path supplied by [env-paths](https://www.npmjs.com/package/env-paths)*

`environment.dataPath` is the path used for storing blockchain data.

In the [local docker](/docs/node-docker#Examples) example we could store blockchain data in a location other than `/root/.local/share/neo_one_node`, it should be noted you will need to change the mount location as well.

### chainFile

*disabled by default*

Optional path for syncing from a local `chainFile`. A chainfile is a full binary of blockchain data that can be used to **hard** re-sync the chain. As opposed to a normal backup this is used to re-sync instead of restore. This is useful in extreme situations like a fork.

::: warning

Note

Syncing from a chainfile can take a **very** long time. Upwards of 30 hours.

:::

### dumpChainFile

*disabled by default*

Optional path for outputting a `chainFile`.

### monitor

*defaults to **'info'***

Desired logging level of the node monitor, options are
```
'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'
```

### haltOnSync

*defaults to **false***

`haltOnSync` enables a watcher which will halt the node when the rpc server's `readyHealthCheck` passes and begin a backup if a location is specified which you are authorized to push to.

::: warning

Note

To properly halt and backup, you must also provide `backup` and `rpc.readyHealthCheck` configurations. In the case of google-cloud you must also provide service credentials.

:::

### levelDownOptions

*see the [leveldown documentation](https://github.com/Level/leveldown#options)*

### telemetry

*disabled by default*

`environment.telemetry.port` specifies the port to use when serving node-metrics. When enabled, you can visit `localhost:<port>/metrics` to view metrics.

## Settings

```bash
{
  "settings": {
    "type": string,
    "privateNet": boolean,
    "address": string,
    "standbyValidators": string[]
  }
}
```

### type

*defaults to 'main'*

`settings.type` specifies which NEO network we are connecting to.

### privateNet

*defaults to **false***

`settings.privateNet` specifies whether or not the node is connecting to a private network.

### address

*defaults to '5fa99d93303775fe50ca119c327759313eccfa1c'*

`settings.address` sets the initial address we send tokens to on private net.

### standbyValidators

List of consensus nodes.

## RPC

```bash
...
{
  "rpc": {
    "http?": {
      "port": number,
      "host": string
    },
    "https?": {
      "port": number,
      "host": string,
      "cert": string,
      "key": string
    },
    "server?": {
      "keepAliveTimeout": number,
    },
    "liveHealthCheck?": {
      "rpcURLs?": string[],
      "offset?": number,
      "timeoutMS?": number,
      "checkEndpoints?": number
    },
    "readyHealthCheck?": {
      "rpcURLs?": string[],
      "offset?": number,
      "timeoutMS?": number,
      "checkEndpoints?": number
    },
    "tooBusyCheck?": {
      "enabled": boolean,
      "interval?": number,
      "maxLag?": number
    },
    "rateLimit?": {
      "enabled": boolean,
      "duration?": number,
      "max?": number
    }
  }
}
...
```

`rpc` options configures the internal RPC Server of the node. See `@neo-one/node-http-rpc`.

---

*by default only http is enabled on `localhost:8080` OR `localhost:$PORT` if you have set the `PORT` environment variable*

`rpc.http` or `rpc.https` are used to configure the rpc server’s host options. You do not need to specify both http and https options.

### Hot Options
*these options can be changed without restarting the node*

`server.keepAliveTimeout`: if you would like your server to close after *x* seconds without activity set a timeout here (in milliseconds).

`liveHealthCheck` *&* `readyHealthCheck` share the same configuration.
- `rpcURLs`: a list of RPC URLs to compare our node to
- `offset`: the acceptable difference of blocks ahead/behind to count as `live` or `ready`
- `timeoutMS`: timeout for RPC connections
- `checkEndpoints`: the number of different endpoints to check against before passing `true`/`false`.

`tooBusyCheck` (*experimental*): enable the tooBusy middleware which throttles requests to the node when under significant load. Currently an experimental feature, see [toobusy-js](https://github.com/strml/node-toobusy) for more. Set `tooBusyCheck.enabled` to **true** if you would like to try it.

`rateLimit` (*experimental*): enable the rateLimiter middleware which throttles requests to the node when too many have been made from the same address over a period of time. Currently an experimental feature, see [koa-ratelimit-lru](https://github.com/Dreamacro/koa-ratelimit-lru) for more. Set `rateLimit.enabled` to **true** to experiment with it.

## Node

```bash
...
{
  "node": {
    "externalPort?": number,
    "rpcURLs?": string[],
    "consensus?": {
      "enabled": boolean,
      "privateKey": string,
      "privateNet": boolean
    }
  }
}
...
```

`node` options control connections and consensus options for the NEO•ONE Node.

---

`externalPort` specifies the external port of the node, useful for a deployment when the container ports are different from the cluster port.

### Hot Options
*these options can be changed without restarting the node*

`rpcURLs` specifies a list of known node RPC URLs you would like to try and connect to. A list of public mainnet hosts can be found at http://monitor.cityofzion.io/.

`unhealthyPeerSeconds` sets how long (in seconds) to wait for a peer response before deeming it 'unhealthy'. Defaults to 300 seconds.

`consensus` sets the consensus options for the node, requires a privateNet setup.

  - `enabled` enables consensus
  - `privateKey` the key for the network
  - `privateNet` true/false

## Network

```bash
...
{
  "network": {
    "listenTCP": {
      "port": number,
      "host?": string
    },
    "seeds?": string[],
    "peerSeeds?": string[],
    "externalEndpoints?": string[],
    "maxConnectedPeers?": number,
    "connectPeersDelayMS?": number,
    "socketTimeoutMS?": number
  }
}
...
```

`network` options can be used to control seeds, endpoints, and socketTimeout defaults.

---

`listenTCP` when provided at least a port this allows other nodes to create TCP connections with this one over that port. `host` is optional and defaults to 'localhost'.

### Hot Options
*these options can be changed without restarting the node*

`seeds` specifies external seeds you would like to connect to.

`peerSeeds` specifies trusted seeds, typically ones run by yourself or on the same cluster.

`externalEndpoints` specifies specific known external peers.

`maxConnectedPeers` sets the maximum number of peers the node will attempt to hold a connection with at once. Defaults to 10.

`connectPeersDelayMS` sets the amount of time (in milliseconds) to wait after requesting a peer connection before requesting another. Defaults to 5000.

`socketTimeoutMS` sets the timeout of peer requests (in milliseconds). Defaults to 1 minute.

## backup
```bash
...
{
  "backup": {
    "tmpPath?": string,
    "readyPath?": string,
    // observable options
    "restore?": boolean,
    "cronSchedule?": string,
    "provider?": {
      "gcloud?": {
        "projectID": string,
        "bucket": string,
        "prefix": string,
        "keepBackupCount?": number,
        "maxSizeBytes?": number
      },

      "mega?": {
        "download?": {
          "id": string,
          "key": string
        },

        "upload?": {
          "email": string,
          "password": string,
          "file": string
        }
      }
    }
  }
}
...
```

`backup` options handle the backup and restore configuration for the node.

---

`tmpPath` *(defaults to ${environment.dataPath}/tmp)* specifies the file path to use for downloading backup files before extraction.

`readyPath` *(defaults to ${environment.dataPath}/ready)* specifies the file path to use when flagging the restore as 'ready'.

### Hot Options
*these options can be changed without restarting the node*

`restore`: set to **true** to attempt and pull the latest backup from your provider on starting the node, **false** to ignore restoring and only backup.

`cronschedule`: set a schedule for when to stop the node and backup. See `[cron format](http://www.nncron.ru/help/EN/working/cron-format.htm)

`provider` is where you will specify either a `gcloud` or `mega` provider. NEO•ONE maintains a public google cloud repository of backups you may restore from using:

```bash
{
  "backup": {
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

Where `maxSizeBytes` is the maximum size for a chunk of uploaded data.
