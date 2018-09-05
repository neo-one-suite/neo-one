import { Hash256 } from '@neo-one/client';
import { enableConsoleLogForTest } from '@neo-one/client-switch';
import BigNumber from 'bignumber.js';
import { helpers } from '../../../../__data__';

const properties = `
public readonly properties = {
  codeVersion: '1.0',
  author: 'dicarlo2',
  email: 'alex.dicarlo@neotracker.io',
  description: 'The TestSmartContract',
};
`;

describe('InvokeSmartContractHelper', () => {
  test('class that used processedTransactions, send, receive and claim', async () => {
    enableConsoleLogForTest();
    const node = await helpers.startNode();
    const accountID = node.masterWallet.account.id;
    const contract = await node.addContract(`
      import { Address, Deploy, SmartContract, send, receive, claim } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        public constructor(public readonly owner = Deploy.senderAddress) {
          super();
        }

        @send
        public send(): boolean {
          return Address.isCaller(this.owner);
        }

        @receive
        public receive(): boolean {
          return Address.isCaller(this.owner);
        }

        @send
        @receive
        public sendReceive(): boolean {
          return Address.isCaller(this.owner);
        }

        @claim
        public claim(): boolean {
          return Address.isCaller(this.owner);
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(owner: Address): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(Address.from('${accountID.address}')), true);
    `);

    const transferResult = await node.client.transfer([
      {
        asset: Hash256.NEO,
        amount: new BigNumber(10),
        to: contract.address,
      },
    ]);
    await transferResult.confirmed();

    let account = await node.client.read(accountID.network).getAccount(contract.address);
    expect(account.balances[Hash256.NEO].toString()).toEqual('10');

    const smartContract = node.client.smartContract({
      networks: {
        [accountID.network]: {
          address: contract.address,
        },
      },
      abi: {
        functions: [
          {
            name: 'refundAssets',
            send: true,
            parameters: [{ name: 'transactionHash', type: 'Hash256' }],
            returnType: { type: 'Boolean' },
          },
          {
            name: 'claim',
            claim: true,
            parameters: [],
            returnType: { type: 'Boolean' },
          },
          {
            name: 'receive',
            receive: true,
            parameters: [],
            returnType: { type: 'Boolean' },
          },
          {
            name: 'send',
            send: true,
            parameters: [],
            returnType: { type: 'Boolean' },
          },
          {
            name: 'sendReceive',
            send: true,
            receive: true,
            parameters: [],
            returnType: { type: 'Boolean' },
          },
        ],
      },
      sourceMaps: Promise.resolve(node.sourceMaps),
    });

    await expect(
      smartContract.refundAssets(transferResult.transaction.hash, {
        sendFrom: [
          {
            asset: Hash256.NEO,
            amount: new BigNumber(9),
            to: accountID.address,
          },
        ],
      }),
    ).rejects.toBeDefined();

    const count = await node.client.read(accountID.network).getBlockCount();
    await Promise.all([
      node.client.read(accountID.network).getBlock(count, { timeoutMS: 2500 }),
      node.developerClient.runConsensusNow(),
    ]);

    account = await node.client.read(accountID.network).getAccount(contract.address);
    expect(account.balances[Hash256.NEO].toString()).toEqual('10');

    const refundResult = await smartContract.refundAssets(transferResult.transaction.hash, {
      sendFrom: [
        {
          asset: Hash256.NEO,
          amount: new BigNumber(10),
          to: accountID.address,
        },
      ],
    });
    const refundReceipt = await refundResult.confirmed();
    expect(refundReceipt.result.state).toEqual('HALT');

    await expect(
      smartContract.refundAssets(transferResult.transaction.hash, {
        sendFrom: [
          {
            asset: Hash256.NEO,
            amount: new BigNumber(10),
            to: accountID.address,
          },
        ],
      }),
    ).rejects.toBeDefined();

    const claimResult = await smartContract.claim({ claimAll: true });
    await claimResult.confirmed();
    expect(claimResult.transaction.outputs.length).toEqual(1);

    const receiveResult = await smartContract.receive({
      sendTo: [
        {
          asset: Hash256.NEO,
          amount: new BigNumber(20),
        },
      ],
    });
    const receiveReceipt = await receiveResult.confirmed();
    expect(receiveReceipt.result.state).toEqual('HALT');

    const sendResult = await smartContract.send({
      sendFrom: [
        {
          asset: Hash256.NEO,
          amount: new BigNumber(10),
          to: accountID.address,
        },
      ],
    });
    const sendReceipt = await sendResult.confirmed();
    expect(sendReceipt.result.state).toEqual('HALT');

    await expect(
      smartContract.refundAssets(sendResult.transaction.hash, {
        sendFrom: [
          {
            asset: Hash256.NEO,
            amount: new BigNumber(10),
            to: accountID.address,
          },
        ],
      }),
    ).rejects.toBeDefined();

    account = await node.client.read(accountID.network).getAccount(contract.address);
    expect(account.balances[Hash256.NEO].toString()).toEqual('10');

    const sendReceiveResult = await smartContract.sendReceive({
      sendTo: [
        {
          asset: Hash256.GAS,
          amount: new BigNumber(20),
        },
      ],
      sendFrom: [
        {
          asset: Hash256.NEO,
          amount: new BigNumber(10),
          to: accountID.address,
        },
      ],
    });
    const sendReceiveReceipt = await sendReceiveResult.confirmed();
    expect(sendReceiveReceipt.result.state).toEqual('HALT');

    await expect(
      smartContract.refundAssets(sendResult.transaction.hash, {
        sendFrom: [
          {
            asset: Hash256.GAS,
            amount: new BigNumber(20),
            to: accountID.address,
          },
        ],
      }),
    ).rejects.toBeDefined();

    account = await node.client.read(accountID.network).getAccount(contract.address);
    expect(account.balances[Hash256.GAS].toString()).toEqual('20');
    expect(account.balances[Hash256.NEO]).toBeUndefined();
  });
});
