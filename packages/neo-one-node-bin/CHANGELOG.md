# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.2.0](https://github.com/neo-one-suite/neo-one/compare/@neo-one/node-bin@2.1.0...@neo-one/node-bin@2.2.0) (2019-08-23)


### Features

* **build:** fix bin package.jsons ([#1704](https://github.com/neo-one-suite/neo-one/issues/1704)) ([e7f9b83](https://github.com/neo-one-suite/neo-one/commit/e7f9b83))
* **e2e:** node-bin e2e consensus test ([0671932](https://github.com/neo-one-suite/neo-one/commit/0671932))





# [2.1.0](https://github.com/neo-one-suite/neo-one/compare/@neo-one/node-bin@2.0.0...@neo-one/node-bin@2.1.0) (2019-08-22)


### Bug Fixes

* **node:** fix shutdown process for node-bin ([0c4812a](https://github.com/neo-one-suite/neo-one/commit/0c4812a))


### Features

* **monitor:** remove @neo-one/monitor. replace with opencensus, pino, and debug ([#1597](https://github.com/neo-one-suite/neo-one/issues/1597)) ([4b1a28f](https://github.com/neo-one-suite/neo-one/commit/4b1a28f))
* **node:** fixup node-bin error handling ([21e2e00](https://github.com/neo-one-suite/neo-one/commit/21e2e00))





# [2.0.0](https://github.com/neo-one-suite/neo-one/compare/@neo-one/node-bin@1.2.3...@neo-one/node-bin@2.0.0) (2019-07-29)


### chore

* **node:** re-organize '@neo-one/node-bin' configuration layout ([1430584](https://github.com/neo-one-suite/neo-one/commit/1430584)), closes [#1102](https://github.com/neo-one-suite/neo-one/issues/1102)


### BREAKING CHANGES

* **node:** old node-bin configs/.rc will almost surely not work. While I update the documentation you can refer here for a rough draft of the new layout: https://gist.github.com/danwbyrne/c6ee99309fea79d90ac3044c0e6c25fe





## [1.2.3](https://github.com/neo-one-suite/neo-one/compare/@neo-one/node-bin@1.2.2...@neo-one/node-bin@1.2.3) (2019-06-20)


### Bug Fixes

* **deps:** update dependency typescript to v3.5.1 ([#1365](https://github.com/neo-one-suite/neo-one/issues/1365)) ([ec89546](https://github.com/neo-one-suite/neo-one/commit/ec89546))
* **website:** fix various website issues, some still outstanding ([659233c](https://github.com/neo-one-suite/neo-one/commit/659233c))





## [1.2.2](https://github.com/neo-one-suite/neo-one/compare/@neo-one/node-bin@1.2.1...@neo-one/node-bin@1.2.2) (2019-06-04)


### Bug Fixes

* **deps:** update definitelytyped ([a8aec42](https://github.com/neo-one-suite/neo-one/commit/a8aec42))
* **deps:** update dependency fs-extra to v8 ([b11630d](https://github.com/neo-one-suite/neo-one/commit/b11630d))
* **deps:** update misc dependencies ([8a3107a](https://github.com/neo-one-suite/neo-one/commit/8a3107a))





## [1.2.1](https://github.com/neo-one-suite/neo-one/compare/@neo-one/node-bin@1.2.0...@neo-one/node-bin@1.2.1) (2019-04-12)

**Note:** Version bump only for package @neo-one/node-bin





# [1.2.0](https://github.com/neo-one-suite/neo-one/compare/@neo-one/node-bin@1.1.0...@neo-one/node-bin@1.2.0) (2019-03-27)


### Features

* **node:** add node Documentation and Heroku Deployment ([da1d295](https://github.com/neo-one-suite/neo-one/commit/da1d295))





# [1.1.0](https://github.com/neo-one-suite/neo-one/compare/@neo-one/node-bin@1.0.2...@neo-one/node-bin@1.1.0) (2019-02-21)

**Note:** Version bump only for package @neo-one/node-bin





## [1.0.2](https://github.com/neo-one-suite/neo-one/compare/@neo-one/node-bin@1.0.2-alpha.0...@neo-one/node-bin@1.0.2) (2019-02-21)

**Note:** Version bump only for package @neo-one/node-bin





## 1.0.2-alpha.0 (2019-02-15)


### Bug Fixes

* **deps:** update dependency @types/rc to ^0.0.2 ([7ba7775](https://github.com/neo-one-suite/neo-one/commit/7ba7775))
* **deps:** update dependency @types/rc to v1 ([57791de](https://github.com/neo-one-suite/neo-one/commit/57791de))
* **deps:** update dependency @types/seamless-immutable to v7.1.6 ([ef4dcca](https://github.com/neo-one-suite/neo-one/commit/ef4dcca))
* **deps:** update dependency rxjs to v6.4.0 ([e28af2a](https://github.com/neo-one-suite/neo-one/commit/e28af2a))


### Features

* **node:** add  as a default for the rpc server ([2aced7f](https://github.com/neo-one-suite/neo-one/commit/2aced7f))
* **node:** add  configuration to @neo-one/node-bin ([5bffb32](https://github.com/neo-one-suite/neo-one/commit/5bffb32))
* **node:** add @neo-one/node-bin. ([a6a86ea](https://github.com/neo-one-suite/neo-one/commit/a6a86ea))
* **node:** Add backup config and prepare the node for automated backups. ([523fa5b](https://github.com/neo-one-suite/neo-one/commit/523fa5b))
* **node:** add dockerfile for building node container. ([9559d3a](https://github.com/neo-one-suite/neo-one/commit/9559d3a))
