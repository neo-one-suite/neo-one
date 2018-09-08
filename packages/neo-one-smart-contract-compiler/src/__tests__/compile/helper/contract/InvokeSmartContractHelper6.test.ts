import { createPrivateKey, Hash256, privateKeyToAddress } from '@neo-one/client';
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
      assertEqual(contract.deploy(Address.from('${accountID.address}')), false);
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

  test('realistic classes that uses forward args and forwarded args', async () => {
    const node = await helpers.startNode();
    const token = await node.addContract(`
      import {
        Address,
        constant,
        Contract,
        createEventNotifier,
        Fixed,
        ForwardValue,
        MapStorage,
        SmartContract,
      } from '@neo-one/smart-contract';

      const notifyTransfer = createEventNotifier<Address | undefined, Address | undefined, Fixed<8>>(
        'transfer',
        'from',
        'to',
        'amount',
      );

      interface TokenPayableContract {
        // tslint:disable-next-line readonly-array
        readonly approveReceiveTransfer: (from: Address, amount: Fixed<0>, asset: Address, ...args: ForwardValue[]) => boolean;
      }

      export class Token extends SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'NEO•ONE Token',
        };
        public readonly name = 'One';
        public readonly symbol = 'ONE';
        public readonly decimals = 8;
        private readonly balances = MapStorage.for<Address, Fixed<8>>();
        private mutableSupply: Fixed<8> = 0;

        @constant
        public get totalSupply(): Fixed<8> {
          return this.mutableSupply;
        }

        @constant
        public balanceOf(address: Address): Fixed<8> {
          const balance = this.balances.get(address);

          return balance === undefined ? 0 : balance;
        }

        // tslint:disable-next-line readonly-array
        public transfer(from: Address, to: Address, amount: Fixed<8>, ...approveArgs: ForwardValue[]): boolean {
          if (amount < 0) {
            throw new Error(\`Amount must be greater than 0: \${amount}\`);
          }

          const fromBalance = this.balanceOf(from);
          if (fromBalance < amount) {
            return false;
          }

          if (!Address.isCaller(from)) {
            return false;
          }

          const contract = Contract.for(to);
          if (contract !== undefined && !Address.isCaller(to)) {
            const smartContract = SmartContract.for<TokenPayableContract>(to);
            if (!smartContract.approveReceiveTransfer(from, amount, this.address, ...approveArgs)) {
              return false;
            }
          }

          const toBalance = this.balanceOf(to);
          this.balances.set(from, fromBalance - amount);
          this.balances.set(to, toBalance + amount);
          notifyTransfer(from, to, amount);

          return true;
        }

        public issue(to: Address, amount: Fixed<8>): boolean {
          if (amount < 0) {
            throw new Error(\`Amount must be greater than 0: \${amount}\`);
          }

          const toBalance = this.balanceOf(to);
          this.balances.set(to, toBalance + amount);
          notifyTransfer(undefined, to, amount);
          this.mutableSupply += amount;

          return true;
        }
      }
    `);

    const escrow = await node.addContract(`
      import { Address, constant, Fixed, ForwardedValue, MapStorage, SmartContract } from '@neo-one/smart-contract';

      export class Escrow extends SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'Escrow account',
        };
        private readonly balances = MapStorage.for<[Address, Address, Address], Fixed<8>>();

        @constant
        public balanceOf(from: Address, to: Address, asset: Address): Fixed<8> {
          const balance = this.balances.get([to, asset, from]);

          return balance === undefined ? 0 : balance;
        }

        public approveReceiveTransfer(from: Address, amount: Fixed<8>, asset: Address, to: ForwardedValue<Address>): boolean {
          if (!Address.isCaller(asset)) {
            return false;
          }

          this.setBalance(from, to, asset, this.balanceOf(from, to, asset) + amount);

          return true;
        }

        private setBalance(from: Address, to: Address, asset: Address, amount: Fixed<8>): void {
          this.balances.set([to, asset, from], amount);
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
      }
      const token = SmartContract.for<Contract>(Address.from('${token.address}'));
      const escrow = SmartContract.for<Contract>(Address.from('${escrow.address}'));

      assertEqual(token.deploy(), true);
      assertEqual(escrow.deploy(), true);
    `);

    const accountID = node.masterWallet.account.id;
    const tokenContract = node.client.smartContract({
      networks: {
        [accountID.network]: {
          address: token.address,
        },
      },
      abi: {
        functions: [
          {
            name: 'balanceOf',
            constant: true,
            parameters: [{ name: 'address', type: 'Address' }],
            returnType: { type: 'Integer', decimals: 8 },
          },
          {
            name: 'transfer',
            parameters: [
              { name: 'from', type: 'Address' },
              { name: 'to', type: 'Address' },
              { name: 'amount', type: 'Integer', decimals: 8 },
              { name: 'approveArgs', type: 'ForwardValue', rest: true },
            ],
            returnType: { type: 'Boolean' },
          },
          {
            name: 'issue',
            parameters: [{ name: 'to', type: 'Address' }, { name: 'amount', type: 'Integer', decimals: 8 }],
            returnType: { type: 'Boolean' },
          },
        ],
        events: [
          {
            name: 'transfer',
            parameters: [
              {
                type: 'Address',
                name: 'from',
                optional: true,
              },
              {
                type: 'Address',
                name: 'to',
                optional: true,
              },
              {
                type: 'Integer',
                name: 'amount',
                decimals: 8,
              },
            ],
          },
        ],
      },
      sourceMaps: Promise.resolve(node.sourceMaps),
    });

    const escrowContract = node.client.smartContract({
      networks: {
        [accountID.network]: {
          address: escrow.address,
        },
      },
      abi: {
        functions: [
          {
            name: 'balanceOf',
            constant: true,
            parameters: [
              { name: 'from', type: 'Address' },
              { name: 'to', type: 'Address' },
              { name: 'asset', type: 'Address' },
            ],
            returnType: { type: 'Integer', decimals: 8 },
          },
          {
            name: 'approveReceiveTransfer',
            parameters: [
              { name: 'from', type: 'Address' },
              { name: 'amount', type: 'Integer', decimals: 8 },
              { name: 'asset', type: 'Address' },
              { name: 'to', type: 'Address', forwardedValue: true },
            ],
            returnType: { type: 'Boolean' },
          },
        ],
      },
      sourceMaps: Promise.resolve(node.sourceMaps),
    });

    let receipt = await tokenContract.issue.confirmed(accountID.address, new BigNumber('20'));
    if (receipt.result.state === 'FAULT') {
      throw new Error(receipt.result.message);
    }
    const toAddress = privateKeyToAddress(createPrivateKey());
    receipt = await tokenContract.transfer.confirmed(
      accountID.address,
      escrow.address,
      new BigNumber('10'),
      ...escrowContract.forwardApproveReceiveTransferArgs(toAddress),
    );
    if (receipt.result.state === 'FAULT') {
      throw new Error(receipt.result.message);
    }
    const result = await escrowContract.balanceOf(accountID.address, toAddress, token.address);
    expect(result.toString()).toEqual('10');
  });

  test('classes that uses forward args, forwarded args, forward return and forwarded return values', async () => {
    const node = await helpers.startNode();
    const forward = await node.addContract(`
      import {
        Address,
        constant,
        ForwardValue,
        SmartContract,
      } from '@neo-one/smart-contract';

      interface TokenPayableContract {
        readonly forwardTo: (...args: ForwardValue[]) => ForwardValue;
        readonly forwardToConstant: (...args: ForwardValue[]) => ForwardValue;
      }

      export class Forward extends SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'NEO•ONE Token',
        };

        public forward(address: Address, ...forwardArgs: ForwardValue[]): ForwardValue {
          const smartContract = SmartContract.for<TokenPayableContract>(address);

          return smartContract.forwardTo(...forwardArgs);
        }

        @constant
        public forwardConstant(address: Address, ...forwardArgs: ForwardValue[]): ForwardValue {
          const smartContract = SmartContract.for<TokenPayableContract>(address);

          return smartContract.forwardToConstant(...forwardArgs);
        }
      }
    `);

    const forwarded = await node.addContract(`
      import { constant, Fixed, Integer, ForwardedValue, SmartContract } from '@neo-one/smart-contract';

      export class Forwarded extends SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'Escrow account',
        };

        public forwardTo(first: ForwardedValue<Fixed<8>>, second: ForwardedValue<Integer>): ForwardedValue<Fixed<8>> {
          return first * second;
        }

        @constant
        public forwardToConstant(first: ForwardedValue<Fixed<8>>, second: ForwardedValue<Integer>): ForwardedValue<Fixed<8>> {
          return first * second;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
      }
      const forward = SmartContract.for<Contract>(Address.from('${forward.address}'));
      const forwarded = SmartContract.for<Contract>(Address.from('${forwarded.address}'));

      assertEqual(forward.deploy(), true);
      assertEqual(forwarded.deploy(), true);
    `);

    const accountID = node.masterWallet.account.id;
    const forwardContract = node.client.smartContract({
      networks: {
        [accountID.network]: {
          address: forward.address,
        },
      },
      abi: {
        functions: [
          {
            name: 'forward',
            parameters: [{ name: 'address', type: 'Address' }, { name: 'args', type: 'ForwardValue', rest: true }],
            returnType: { type: 'ForwardValue' },
          },
          {
            name: 'forwardConstant',
            constant: true,
            parameters: [{ name: 'address', type: 'Address' }, { name: 'args', type: 'ForwardValue', rest: true }],
            returnType: { type: 'ForwardValue' },
          },
        ],
      },
      sourceMaps: Promise.resolve(node.sourceMaps),
    });

    const forwardedContract = node.client.smartContract({
      networks: {
        [accountID.network]: {
          address: forwarded.address,
        },
      },
      abi: {
        functions: [
          {
            name: 'forwardTo',
            parameters: [
              { name: 'first', type: 'Integer', decimals: 8, forwardedValue: true },
              { name: 'second', type: 'Integer', decimals: 0, forwardedValue: true },
            ],
            returnType: { type: 'Integer', decimals: 8, forwardedValue: true },
          },
          {
            name: 'forwardToConstant',
            constant: true,
            parameters: [
              { name: 'first', type: 'Integer', decimals: 8, forwardedValue: true },
              { name: 'second', type: 'Integer', decimals: 0, forwardedValue: true },
            ],
            returnType: { type: 'Integer', decimals: 8, forwardedValue: true },
          },
        ],
      },
      sourceMaps: Promise.resolve(node.sourceMaps),
    });

    const receipt = await forwardContract.forward.confirmed(
      forwarded.address,
      ...forwardedContract.forwardForwardToArgs(new BigNumber('20'), new BigNumber('3')),
    );
    if (receipt.result.state === 'FAULT') {
      throw new Error(receipt.result.message);
    }
    expect(forwardedContract.forwardForwardToReturn(receipt).result.value.toString()).toEqual('60');

    const result = await forwardContract.forwardConstant(
      forwarded.address,
      ...forwardedContract.forwardForwardToConstantArgs(new BigNumber('20'), new BigNumber('3')),
    );
    expect(forwardedContract.forwardForwardToConstantReturn(result).toString()).toEqual('60');
  });
});
