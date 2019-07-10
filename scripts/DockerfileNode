FROM neotracker/neo-one-circleci-node:10.16.0-1 as builder
RUN mkdir -p /tmp/neo-one
WORKDIR /tmp/neo-one

COPY package.json tsconfig.json lerna.json gulpfile.js yarn.lock LICENSE README.md ./
COPY tsconfig/ tsconfig
COPY types/ types
COPY packages/neo-one-utils/src/ packages/neo-one-utils/src
COPY packages/neo-one-utils/package.json packages/neo-one-utils/
COPY packages/neo-one-logger/src/ packages/neo-one-logger/src
COPY packages/neo-one-logger/package.json packages/neo-one-logger/
COPY packages/neo-one-client/src/ packages/neo-one-client/src
COPY packages/neo-one-client/package.json packages/neo-one-client/
COPY packages/neo-one-client-common/src/ packages/neo-one-client-common/src
COPY packages/neo-one-client-common/package.json packages/neo-one-client-common/
COPY packages/neo-one-client-core/src/ packages/neo-one-client-core/src
COPY packages/neo-one-client-core/package.json packages/neo-one-client-core/
COPY packages/neo-one-client-full-common/src/ packages/neo-one-client-full-common/src
COPY packages/neo-one-client-full-common/package.json packages/neo-one-client-full-common/
COPY packages/neo-one-client-full-core/src/ packages/neo-one-client-full-core/src
COPY packages/neo-one-client-full-core/package.json packages/neo-one-client-full-core/
COPY packages/neo-one-client-full/src/ packages/neo-one-client-full/src
COPY packages/neo-one-client-full/package.json packages/neo-one-client-full/
COPY packages/neo-one-client-switch/src/ packages/neo-one-client-switch/src
COPY packages/neo-one-client-switch/package.json packages/neo-one-client-switch/
COPY packages/neo-one-developer-tools/src/ packages/neo-one-developer-tools/src
COPY packages/neo-one-developer-tools/package.json packages/neo-one-developer-tools/
COPY packages/neo-one-developer-tools-frame/src/ packages/neo-one-developer-tools-frame/src
COPY packages/neo-one-developer-tools-frame/package.json packages/neo-one-developer-tools-frame/
COPY packages/neo-one-node-bin/src/ packages/neo-one-node-bin/src
COPY packages/neo-one-node-bin/package.json packages/neo-one-node-bin/
COPY packages/neo-one-node-blockchain/src/ packages/neo-one-node-blockchain/src
COPY packages/neo-one-node-blockchain/package.json packages/neo-one-node-blockchain/
COPY packages/neo-one-node-consensus/src/ packages/neo-one-node-consensus/src
COPY packages/neo-one-node-consensus/package.json packages/neo-one-node-consensus/
COPY packages/neo-one-node-core/src/ packages/neo-one-node-core/src
COPY packages/neo-one-node-core/package.json packages/neo-one-node-core/
COPY packages/neo-one-node-data-backup/src/ packages/neo-one-node-data-backup/src
COPY packages/neo-one-node-data-backup/package.json packages/neo-one-node-data-backup/
COPY packages/neo-one-node-http-rpc/src/ packages/neo-one-node-http-rpc/src
COPY packages/neo-one-node-http-rpc/package.json packages/neo-one-node-http-rpc/
COPY packages/neo-one-node-neo-settings/src/ packages/neo-one-node-neo-settings/src
COPY packages/neo-one-node-neo-settings/package.json packages/neo-one-node-neo-settings/
COPY packages/neo-one-node-network/src/ packages/neo-one-node-network/src
COPY packages/neo-one-node-network/package.json packages/neo-one-node-network/
COPY packages/neo-one-node-offline/src/ packages/neo-one-node-offline/src
COPY packages/neo-one-node-offline/package.json packages/neo-one-node-offline/
COPY packages/neo-one-node-protocol/src/ packages/neo-one-node-protocol/src
COPY packages/neo-one-node-protocol/package.json packages/neo-one-node-protocol/
COPY packages/neo-one-node-rpc-handler/src/ packages/neo-one-node-rpc-handler/src
COPY packages/neo-one-node-rpc-handler/package.json packages/neo-one-node-rpc-handler/
COPY packages/neo-one-node-storage-common/src/ packages/neo-one-node-storage-common/src
COPY packages/neo-one-node-storage-common/package.json packages/neo-one-node-storage-common/
COPY packages/neo-one-node-storage-levelup/src/ packages/neo-one-node-storage-levelup/src
COPY packages/neo-one-node-storage-levelup/package.json packages/neo-one-node-storage-levelup/
COPY packages/neo-one-node-vm/src/ packages/neo-one-node-vm/src
COPY packages/neo-one-node-vm/package.json packages/neo-one-node-vm/
COPY packages/neo-one-node/src/ packages/neo-one-node/src
COPY packages/neo-one-node/package.json packages/neo-one-node/

RUN sudo yarn install --non-interactive
RUN yarn build:node

FROM node:10-stretch-slim AS production
RUN mkdir -p neo-one
COPY --from=builder tmp/neo-one/dist/neo-one/ neo-one/
ENTRYPOINT ["node", "neo-one/packages/neo-one-node-bin/bin/neo-one-node"]
