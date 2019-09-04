# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.4.2](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.4.1...@neo-one/client-common@1.4.2) (2019-09-04)

**Note:** Version bump only for package @neo-one/client-common





## [1.4.1](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.4.0...@neo-one/client-common@1.4.1) (2019-08-30)

**Note:** Version bump only for package @neo-one/client-common





# [1.4.0](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.3.0...@neo-one/client-common@1.4.0) (2019-08-22)


### Features

* **monitor:** remove @neo-one/monitor. replace with opencensus, pino, and debug ([#1597](https://github.com/neo-one-suite/neo-one/issues/1597)) ([4b1a28f](https://github.com/neo-one-suite/neo-one/commit/4b1a28f))





# [1.3.0](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.2.1...@neo-one/client-common@1.3.0) (2019-07-29)


### Features

* **client:** rewrite binary writer ([3c70708](https://github.com/neo-one-suite/neo-one/commit/3c70708))
* **DapiUserAccountProvider:** Implement DapiUserAccountProvider for the dapi NEP ([afdd119](https://github.com/neo-one-suite/neo-one/commit/afdd119))





## [1.2.1](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.2.0...@neo-one/client-common@1.2.1) (2019-06-20)


### Bug Fixes

* **@neo-one/node-vm:** Remove GetClaimReferences ([6ab91a7](https://github.com/neo-one-suite/neo-one/commit/6ab91a7)), closes [#1412](https://github.com/neo-one-suite/neo-one/issues/1412)
* **deps:** update dependency typescript to v3.5.1 ([#1365](https://github.com/neo-one-suite/neo-one/issues/1365)) ([ec89546](https://github.com/neo-one-suite/neo-one/commit/ec89546))
* **node:** First wave of node fixes ([d50fd34](https://github.com/neo-one-suite/neo-one/commit/d50fd34))





# [1.2.0](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.1.2...@neo-one/client-common@1.2.0) (2019-06-04)


### Bug Fixes

* **@neo-one/types:** eliminate global types from @neo-one/types ([004330d](https://github.com/neo-one-suite/neo-one/commit/004330d))
* **deps:** update misc dependencies ([0c9bdde](https://github.com/neo-one-suite/neo-one/commit/0c9bdde))


### Features

* **client:** Add HDKeyStore ([c09b44f](https://github.com/neo-one-suite/neo-one/commit/c09b44f))
* **client:** HDKeyStore testing ([8f925d4](https://github.com/neo-one-suite/neo-one/commit/8f925d4))
* **RemoteUserAccountProvider:** Base implementation for RemoteUserAccountProvider + Receiver ([3c57f24](https://github.com/neo-one-suite/neo-one/commit/3c57f24))





## [1.1.2](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.1.1...@neo-one/client-common@1.1.2) (2019-04-12)

**Note:** Version bump only for package @neo-one/client-common





## [1.1.1](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.1.0...@neo-one/client-common@1.1.1) (2019-03-27)


### Bug Fixes

* **deps:** update dependency bignumber.js to v8.1.1 ([2d6f93a](https://github.com/neo-one-suite/neo-one/commit/2d6f93a))
* **jest:** fix a flaky crypto test - createKeyPair ([cd1e029](https://github.com/neo-one-suite/neo-one/commit/cd1e029))





# [1.1.0](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.0.2...@neo-one/client-common@1.1.0) (2019-02-21)

**Note:** Version bump only for package @neo-one/client-common





## [1.0.2](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.0.2-alpha.0...@neo-one/client-common@1.0.2) (2019-02-21)

**Note:** Version bump only for package @neo-one/client-common





## [1.0.2-alpha.0](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.0.1...@neo-one/client-common@1.0.2-alpha.0) (2019-02-15)


### Bug Fixes

* **@neo-one/client-common:** fix circular dependency with crypto ([e2e1751](https://github.com/neo-one-suite/neo-one/commit/e2e1751))
* **build:** adjust several packages to allow emitting .d.ts files. ([27a2d88](https://github.com/neo-one-suite/neo-one/commit/27a2d88))
* **deps:** update dependency @neo-one/ec-key to ^0.0.4 ([4c2f7eb](https://github.com/neo-one-suite/neo-one/commit/4c2f7eb))
* **deps:** update dependency @types/bs58 to v4 ([1423cc5](https://github.com/neo-one-suite/neo-one/commit/1423cc5))
* **deps:** update dependency @types/elliptic to v6.4.2 ([af313d4](https://github.com/neo-one-suite/neo-one/commit/af313d4))
* **deps:** update dependency @types/lodash to v4.14.120 ([a76dae7](https://github.com/neo-one-suite/neo-one/commit/a76dae7))
* **deps:** update dependency @types/scrypt-js to v2.0.2 ([792e44a](https://github.com/neo-one-suite/neo-one/commit/792e44a))
* **deps:** update dependency hash.js to v1.1.7 ([c86b627](https://github.com/neo-one-suite/neo-one/commit/c86b627))
* **deps:** update dependency rxjs to v6.4.0 ([e28af2a](https://github.com/neo-one-suite/neo-one/commit/e28af2a))
* **types:** adjust 'scrypt-js' callback usage ([5dace62](https://github.com/neo-one-suite/neo-one/commit/5dace62))


### Features

* **@neo-one/client:** Add iterStorage to NEOONEDataProvider ([0797f74](https://github.com/neo-one-suite/neo-one/commit/0797f74))
* **@neo-one/node-vm:** hash syscalls ([9c7f378](https://github.com/neo-one-suite/neo-one/commit/9c7f378))
* **node:** record storage changes for each transaction ([22ef835](https://github.com/neo-one-suite/neo-one/commit/22ef835))





## [1.0.1](https://github.com/neo-one-suite/neo-one/compare/@neo-one/client-common@1.0.0...@neo-one/client-common@1.0.1) (2018-11-13)

**Note:** Version bump only for package @neo-one/client-common
