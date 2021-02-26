---
slug: node-configuration
title: Configuration Reference
---

This section will serve as a reference for the NEO•ONE Node's many configuration options.

---

[[toc]]

---

## Path

```bash
...
{
  "path?": string
}
...
```

_defaults to the data path supplied by [env-paths](https://www.npmjs.com/package/env-paths)_

`path` is the path used for storing blockchain data.

In the [local docker](/docs/node-docker#Examples) example we could store blockchain data in a location other than `/root/.local/share/neo-one`, it should be noted you will need to change the mount location as well.

## Telemetry

```bash
...
{
  "telemetry?": {
    "logging?": {
      "level": string
    },
    "prometheus?": {
      "prefix?": string,
      "port?": number
    },
    "jaeger?": {
      "host?": string,
      "port?": number,
      "maxPacketSize?": number
    }
    "tracing?": {
      "logLevel?": number,
      "plugins?": {},
      "bufferSize?": number,
      "bufferTimeout?": number
    }
  }
}
...
```

`telemetry` options control the collection and exporting of logs, metrics, and spans from the node.

### Logging

\*defaults to **{level: 'silent'}\***

Desired logging level and output path of the node logging, options are for level are:

```
"silent" | "fatal" | "error" | "warn" | "info" | "debug" | "trace"
```

### Prometheus

_disabled by default_

Enables the Prometheus exporter for exporting metrics about the NEO•ONE Node. You can add an app prefix and choose a port. If no port is set prometheus will default to port `9464`.

### Jaeger

_disabled by default_

Enables the jaeger exporter for exporting spans from the NEO•ONE Node. You can optionally supply a host and port, as well as a limit on the exported packet size. See the [Jaeger homepage](https://www.jaegertracing.io/) for more.

### Tracing

_disabled by default_

Enables trace collection for the NEO•ONE Node. This must be used in tangent with `jaeger` options in order to collect AND export span information from the Node. As advanced options you can enable extra opencensus plugins, as well as limit the size and timeout of spans waiting to be exported.

## Blockchain

```bash
...
#basic configuration
{
  "blockchain": "main" | "test"
}
...
```

```bash
#advanced configuration
...
{
  "blockchain": {
    "genesisBlock": string,
    "governingToken": string,
    "utilityToken": string,
    "decrementInterval": number,
    "generationAmount": number,
    "fees": Record<string, string>,
    "registerValidatorFee": string,
    "messageMagic": number,
    "addressVersion": number,
    "privateKeyVersion": number,
    "standbyValidators": string[],
    "vm": {
      "storageContext": {
        "v0": {
          "index": number
        }
      }
    },
    "secondsPerBlock": number,
    "maxTransactionsPerBlock": number,
    "memPoolSize": number
  }
}
...
```

---

_defaults to `main`_

As a shortcut you can specify the blockchain default settings as `main` or `test` to point to the NEO mainnet/testnet.

In most cases the above will be enough, but you have the ability to define serialized blockchain settings. See [neo-one-node-consensus-test/config](https://github.com/neo-one-suite/neo-one/blob/master/packages/neo-one-node-bin/src/__data__/configs/consensus.ts) for an example of quickly constructing a privateNet using this method.

## RPC

```bash
...
{
  "rpc": {
    "http?": {
      "port": number,
      "host?": string,
      "keepAliveTimeout?": number
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
    }
  }
}
...
```

`rpc` options configures the internal RPC Server of the node. See `@neo-one/node-http-rpc`.

---

### HTTP

_by default http is enabled on `localhost:8080` OR `localhost:$PORT` if you have set the `PORT` environment variable_

`rpc.http` is used to configure the rpc server’s host options. It is important in a kubernetes setup that `containerPort` matches `rpc.http.port`.

`keepAliveTimeout`: if you would like your server to close after _x_ seconds without activity set a timeout here (in milliseconds).

### Health Checks

`liveHealthCheck` _&_ `readyHealthCheck` share the same configuration.

- `rpcURLs`: a list of RPC URLs to compare our node to
- `offset`: the acceptable difference of blocks ahead/behind to count as `live` or `ready`
- `timeoutMS`: timeout for RPC connections
- `checkEndpoints`: the number of different endpoints to check against before passing `true`/`false`.

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

`seeds` specifies external seeds you would like to connect to.

`peerSeeds` specifies trusted seeds, typically ones run by yourself or on the same cluster.

`externalEndpoints` specifies specific known external peers that you want to _ignore_ starting connections with, for instance endpoints in another cluster managed by you.

`maxConnectedPeers` sets the maximum number of peers the node will attempt to hold a connection with at once. Defaults to 10.

`connectPeersDelayMS` sets the amount of time (in milliseconds) to wait after requesting a peer connection before requesting another. Defaults to 5000.

`socketTimeoutMS` sets the timeout of peer requests (in milliseconds). Defaults to 1 minute.
