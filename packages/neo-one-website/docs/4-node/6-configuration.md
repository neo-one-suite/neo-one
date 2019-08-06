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
    "haltOnSync?": boolean,
    "levelDownOptions?": ???,
    "logger?": {
      "level?": string,
      "path?": string
    },
    "telemetry?": {
      "port": number
    }
  }
}
...
```

### dataPath

_defaults to the data path supplied by [env-paths](https://www.npmjs.com/package/env-paths)_

`environment.dataPath` is the path used for storing blockchain data.

In the [local docker](/docs/node-docker#Examples) example we could store blockchain data in a location other than `/root/.local/share/neo_one_node`, it should be noted you will need to change the mount location as well.

### chainFile

_disabled by default_

Optional path for syncing from a local `chainFile`. A chainfile is a full binary of blockchain data that can be used to **hard** re-sync the chain. As opposed to a normal backup this is used to re-sync instead of restore. This is useful in extreme situations like a fork.

::: warning

Note

Syncing from a chainfile can take a **very** long time. Upwards of 30 hours.

:::

### dumpChainFile

_disabled by default_

Optional path for outputting a `chainFile`.

### logger

\*defaults to **{path: undefined, level: 'silent'}\***

Desired logging level and output path of the node logging, options are for level are:

```
'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
```

### haltOnSync

\*defaults to **false\***

`haltOnSync` enables a watcher which will halt the node when the rpc server's `readyHealthCheck` passes and begin a backup if a location is specified which you are authorized to push to.

::: warning

Note

To properly halt and backup, you must also provide `backup` and `rpc.readyHealthCheck` configurations. In the case of google-cloud you must also provide service credentials.

:::

### levelDownOptions

_see the [leveldown documentation](https://github.com/Level/leveldown#options)_

### telemetry

_disabled by default_

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

_defaults to 'main'_

`settings.type` specifies which NEO network we are connecting to. Pre-configured options are `main` and `test`.

### privateNet

\*defaults to **false\***

`settings.privateNet` specifies whether or not the node is connecting to a private network.

### address

_defaults to '5fa99d93303775fe50ca119c327759313eccfa1c'_

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

_by default only http is enabled on `localhost:8080` OR `localhost:$PORT` if you have set the `PORT` environment variable_

`rpc.http` is used to configure the rpc server’s host options. It is important in a kubernetes setup that `containerPort` matches `rpc.http.port`.

### Hot Options

_these options can be changed without restarting the node_

`server.keepAliveTimeout`: if you would like your server to close after _x_ seconds without activity set a timeout here (in milliseconds).

`liveHealthCheck` _&_ `readyHealthCheck` share the same configuration.

- `rpcURLs`: a list of RPC URLs to compare our node to
- `offset`: the acceptable difference of blocks ahead/behind to count as `live` or `ready`
- `timeoutMS`: timeout for RPC connections
- `checkEndpoints`: the number of different endpoints to check against before passing `true`/`false`.

`tooBusyCheck` (_experimental_): enable the tooBusy middleware which throttles requests to the node when under significant load. Currently an experimental feature, see [toobusy-js](https://github.com/strml/node-toobusy) for more. Set `tooBusyCheck.enabled` to **true** if you would like to try it.

`rateLimit` (_experimental_): enable the rateLimiter middleware which throttles requests to the node when too many have been made from the same address over a period of time. Currently an experimental feature, see [koa-ratelimit-lru](https://github.com/Dreamacro/koa-ratelimit-lru) for more. Set `rateLimit.enabled` to **true** to experiment with it.

## Node

```bash
...
{
  "node": {
    "externalPort?": number,
    "rpcURLs?": string[],
    "consensus?": {
      "enabled": boolean,
      "options": {
        "privateKey": string,
        "privateNet": boolean
      }
    }
  }
}
...
```

`node` options control connections and consensus options for the NEO•ONE Node.

---

`externalPort` specifies the external port of the node which it can send messages to peers on. Typically the same as `network.listenTCP`.

### Hot Options

_these options can be changed without restarting the node_

`rpcURLs` specifies a list of known node RPC URLs you would like to try and connect to. A list of public mainnet hosts can be found at http://monitor.cityofzion.io/.

`unhealthyPeerSeconds` sets how long (in seconds) to wait for a peer response before deeming it 'unhealthy'. Defaults to 300 seconds.

`consensus` sets the consensus options for the node, requires a privateNet setup.

- `enabled` enables consensus
- `options.privateKey` the key for the network
- `options.privateNet` true/false

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

_these options can be changed without restarting the node_

`seeds` specifies external seeds you would like to connect to.

`peerSeeds` specifies trusted seeds, typically ones run by yourself or on the same cluster.

`externalEndpoints` specifies specific known external peers that you want to _ignore_ starting connections with, for instance endpoints in another cluster managed by you.

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

`tmpPath` _(defaults to \${environment.dataPath}/tmp)_ specifies the file path to use for downloading backup files before extraction.

`readyPath` _(defaults to \${environment.dataPath}/ready)_ specifies the file path to use when flagging the restore as 'ready'.

### Hot Options

_these options can be changed without restarting the node_

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
