import { common } from '@neo-one/client-common';
import { Block } from '@neo-one/node-core';
import fs from 'fs-extra';
import { FullNode } from '../FullNode';

const timeout = 30000000;
jest.setTimeout(timeout);

const config = {
  path: '/Users/danielbyrne/Desktop/consensus-node-data',
  telemetry: {
    logging: {
      level: 'debug' as const,
    },
  },
  blockchain: {
    genesisBlock: Block.deserializeWire({
      context: { messageMagic: 7630401, validatorsCount: 1 },
      buffer: Buffer.from(
        '000000000000000000000000000000000000000000000000000000000000000000000000a2f039e5cb15af6ab9eecfcb383ddac95c9ddc7f5c09d96c88dd26003a793a81759cf1e17501000000000000d83cd15a5036b5399bb7e6b91db9365a77ddb2510100011102001dac2b7c000000000000000000000000000000000000000000000000000000000001ca61e52e881d41374e640f819cd118cc153b21a700000541123e7fe801000111',
        'hex',
      ),
    }),
    decrementInterval: 2000000,
    generationAmount: [8, 7, 6],
    messageMagic: 7630401,
    addressVersion: common.NEO_ADDRESS_VERSION,
    privateKeyVersion: 128,
    standbyValidators: ['0248be3c070df745a60f3b8b494efcc6caf90244d803a9a72fe95d9bae2120ec70'].map((p) =>
      common.stringToECPoint(p),
    ),
    standbyCommittee: ['0248be3c070df745a60f3b8b494efcc6caf90244d803a9a72fe95d9bae2120ec70'].map((p) =>
      common.stringToECPoint(p),
    ),
    validatorsCount: 1,
    committeeMembersCount: 1,
    millisecondsPerBlock: 1000,
    maxTransactionsPerBlock: 500,
    memoryPoolMaxTransactions: 50000,
  },
  rpc: {
    http: {
      host: '0.0.0.0',
      port: 8081,
    },
    readyHealthCheck: {},
    liveHealthCheck: {},
  },
  node: {
    consensus: {
      privateKey: 'e35fa5d1652c4c65e296c86e63a3da6939bc471b741845be636e2daa320dc770',
      privateNet: true,
    },
  },
};

describe('Consensus Testing', () => {
  beforeEach(async () => {
    try {
      await fs.emptyDir(config.path);
    } catch {
      // do nothing;
    }
  });
  test('Consensus Runner', async () => {
    const fullNode = new FullNode({ options: config });

    await Promise.all([fullNode.start(), new Promise((resolve) => setTimeout(resolve, timeout))]);
  });
});
