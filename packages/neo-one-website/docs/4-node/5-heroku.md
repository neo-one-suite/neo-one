---
slug: node-heroku
title: Heroku Deployment
---

The NEO•ONE Node can be quickly deployed on Heroku using the deployment button below.

More information on Heroku can be found [here](https://heroku.com/).

---

[[toc]]

## Deploy!

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/neo-one-suite/neo-one.git)

Upon successfully building the node-container and launching your app, you should see the node logs in your apps logs.

## Configure

[Configuration Reference](/docs/node-configuration)

You can quickly apply environment variable configuration options to the node using the **Config Vars** in App >> Settings >> Config Vars. As an example we can set the log-level using a `config var` with key:value

```bash
neo_one_node_environment__logging__level verbose
```

After applying the node will restart and update its configuration.

::: warning

Note

Because of the environment-variable syntax `rc` expects, you must use the `neo_one_node_<parent>__<child>` syntax when applying a value.

:::

## Caveats

Currently it is **not** possible to enable two or more `port` requiring processes simultaneously. This is because Heroku only allocates a single port to the app. By default the node's rpc server is using this port so if you would like to enable telemetry through a `config var` you will also need to disable the rpc server.

Additionally it is not possible right now to set environment variable values for Array config options. This should be addressed soon.

::: warning

Note

If you _would_ like to see metrics or enable other features that require a port, you must assign the port to `$PORT`, this is the environment variable supplied by heroku.

:::
