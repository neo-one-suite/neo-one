import { createPrivateKey, Hash256, privateKeyToAddress } from '@neo-one/client-full';
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
      import {
        Address,
        ClaimTransaction,
        Deploy,
        Hash256,
        SmartContract,
        Fixed,
        sendUnsafe,
        send,
        receive,
        claim,
      } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        public constructor(public readonly owner = Deploy.senderAddress) {
          super();
        }

        @send
        public send(receiver: Address, asset: Hash256, amount: Fixed<8>): boolean {
          return receiver.equals(this.owner) && asset.equals(Hash256.NEO) && Address.isCaller(this.owner) && amount > 0;
        }

        @sendUnsafe
        public sendUnsafe(): boolean {
          return Address.isCaller(this.owner);
        }

        @receive
        public receive(): boolean {
          return Address.isCaller(this.owner);
        }

        @sendUnsafe
        @receive
        public sendUnsafeReceive(): boolean {
          return Address.isCaller(this.owner);
        }

        @claim
        public claim(transaction: ClaimTransaction): boolean {
          console.log(transaction.inputs.length);
          return transaction.inputs.length === 0 && Address.isCaller(this.owner);
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
    account = await node.client.read(accountID.network).getAccount(accountID.address);
    expect(account.balances[Hash256.NEO].toString()).toEqual('99999990');

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
            refundAssets: true,
            parameters: [],
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
            name: 'completeSend',
            completeSend: true,
            parameters: [],
            returnType: { type: 'Boolean' },
          },
          {
            name: 'sendUnsafe',
            sendUnsafe: true,
            parameters: [],
            returnType: { type: 'Boolean' },
          },
          {
            name: 'sendUnsafeReceive',
            sendUnsafe: true,
            receive: true,
            parameters: [],
            returnType: { type: 'Boolean' },
          },
        ],
      },
      sourceMaps: Promise.resolve(node.sourceMaps),
    });

    const refundResult = await smartContract.refundAssets(transferResult.transaction.hash);
    const refundReceipt = await refundResult.confirmed();
    expect(refundReceipt.result.state).toEqual('HALT');
    if (refundReceipt.result.state === 'HALT') {
      expect(refundReceipt.result.value).toBeTruthy();
    }
    expect(refundReceipt.result.gasCost).toMatchSnapshot();

    account = await node.client.read(accountID.network).getAccount(contract.address);
    expect(account.balances[Hash256.NEO]).toBeUndefined();
    account = await node.client.read(accountID.network).getAccount(accountID.address);
    expect(account.balances[Hash256.NEO].toString()).toEqual('100000000');

    await expect(smartContract.refundAssets(transferResult.transaction.hash)).rejects.toBeDefined();

    const claimResult = await smartContract.claim();
    await claimResult.confirmed();
    expect(claimResult.transaction.outputs.length).toEqual(1);

    const receiveResult = await smartContract.receive({
      sendTo: [
        {
          asset: Hash256.NEO,
          amount: new BigNumber(40),
        },
      ],
    });
    const receiveReceipt = await receiveResult.confirmed();
    expect(receiveReceipt.result.state).toEqual('HALT');
    if (receiveReceipt.result.state === 'HALT') {
      expect(receiveReceipt.result.value).toBeTruthy();
    }
    expect(receiveReceipt.result.gasCost).toMatchSnapshot();

    const sendUnsafeResult = await smartContract.sendUnsafe({
      sendFrom: [
        {
          asset: Hash256.NEO,
          amount: new BigNumber(10),
          to: accountID.address,
        },
      ],
    });
    const sendUnsafeReceipt = await sendUnsafeResult.confirmed();
    expect(sendUnsafeReceipt.result.state).toEqual('HALT');
    if (sendUnsafeReceipt.result.state === 'HALT') {
      expect(sendUnsafeReceipt.result.value).toBeTruthy();
    }
    expect(sendUnsafeReceipt.result.gasCost).toMatchSnapshot();

    await expect(smartContract.refundAssets(sendUnsafeResult.transaction.hash)).rejects.toBeDefined();

    account = await node.client.read(accountID.network).getAccount(contract.address);
    expect(account.balances[Hash256.NEO].toString()).toEqual('30');

    const sendUnsafeReceiveResult = await smartContract.sendUnsafeReceive({
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
    const sendUnsafeReceiveReceipt = await sendUnsafeReceiveResult.confirmed();
    expect(sendUnsafeReceiveReceipt.result.state).toEqual('HALT');
    expect(sendUnsafeReceiveReceipt.result.gasCost).toMatchSnapshot();

    await expect(smartContract.refundAssets(sendUnsafeReceiveResult.transaction.hash)).rejects.toBeDefined();

    account = await node.client.read(accountID.network).getAccount(contract.address);
    expect(account.balances[Hash256.GAS].toString()).toEqual('20');
    expect(account.balances[Hash256.NEO].toString()).toEqual('20');

    const sendResult = await smartContract.send({
      asset: Hash256.NEO,
      amount: new BigNumber(10),
      to: accountID.address,
    });
    await Promise.all([
      // Rejected because method returns false
      expect(
        smartContract.send({
          asset: Hash256.GAS,
          amount: new BigNumber(10),
          to: accountID.address,
        }),
      ).rejects.toBeDefined(),
      // Rejected because no available outputs
      expect(
        smartContract.send({
          asset: Hash256.NEO,
          amount: new BigNumber(5),
          to: accountID.address,
        }),
      ).rejects.toBeDefined(),
    ]);
    const sendReceipt = await sendResult.confirmed();
    expect(sendReceipt.result.state).toEqual('HALT');
    expect(sendReceipt.result.gasCost).toMatchSnapshot();

    account = await node.client.read(accountID.network).getAccount(contract.address);
    expect(account.balances[Hash256.GAS].toString()).toEqual('20');
    expect(account.balances[Hash256.NEO].toString()).toEqual('20');

    const completeSendReceipt = await smartContract.completeSend.confirmed(sendResult.transaction.hash);
    expect(completeSendReceipt.result.state).toEqual('HALT');
    expect(completeSendReceipt.result.gasCost).toMatchSnapshot();

    account = await node.client.read(accountID.network).getAccount(contract.address);
    expect(account.balances[Hash256.GAS].toString()).toEqual('20');
    expect(account.balances[Hash256.NEO].toString()).toEqual('10');

    const sendResult0 = await smartContract.send({
      asset: Hash256.NEO,
      amount: new BigNumber(10),
      to: accountID.address,
    });
    const sendReceipt0 = await sendResult0.confirmed();
    expect(sendReceipt0.result.state).toEqual('HALT');
    expect(sendReceipt0.result.gasCost).toMatchSnapshot();

    account = await node.client.read(accountID.network).getAccount(contract.address);
    expect(account.balances[Hash256.GAS].toString()).toEqual('20');
    expect(account.balances[Hash256.NEO].toString()).toEqual('10');

    const completeSendReceipt0 = await smartContract.completeSend.confirmed(sendResult0.transaction.hash);
    expect(completeSendReceipt0.result.state).toEqual('HALT');
    expect(completeSendReceipt0.result.gasCost).toMatchSnapshot();

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
      import { Address, constant, Fixed, ForwardedValue, MapStorage, SmartContract, createEventNotifier } from '@neo-one/smart-contract';

      const notifyAvailable = createEventNotifier<Address, Address, Address, Fixed<8>>(
        'available',
        'from',
        'to',
        'asset',
        'amount',
      );

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
          notifyAvailable(from, to, asset, amount);

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
        events: [
          {
            name: 'available',
            parameters: [
              {
                type: 'Address',
                name: 'from',
              },
              {
                type: 'Address',
                name: 'to',
              },
              {
                type: 'Address',
                name: 'asset',
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
    expect(receipt.events).toHaveLength(2);
    expect(receipt.events[0].name).toEqual('available');
    expect(receipt.events[1].name).toEqual('transfer');
    const result = await escrowContract.balanceOf(accountID.address, toAddress, token.address);
    expect(result.toString()).toEqual('10');
  });

  test('classes that uses forward args, forwarded args, forward return and forwarded return values', async () => {
    const node = await helpers.startNode();
    const { contract: forward, definition: forwardDefinition } = await node.addContractWithDefinition(`
      import {
        Address,
        constant,
        ForwardValue,
        SmartContract,
        createEventNotifier,
      } from '@neo-one/smart-contract';

      interface TokenPayableContract {
        readonly forward: (address: Address, ...args: ForwardValue[]) => ForwardValue;
        readonly forwardReturn: (address: Address) => ForwardValue;
        readonly forwardConstant: (address: Address, ...args: ForwardValue[]) => ForwardValue;
        readonly forwardTo: (...args: ForwardValue[]) => ForwardValue;
        readonly forwardToReturn: (a: number, b: number) => ForwardValue;
        readonly forwardToConstant: (...args: ForwardValue[]) => ForwardValue;
      }

      const forwardEvent = createEventNotifier('forwardEvent');
      const forwardForwardEvent = createEventNotifier('forwardForwardEvent');

      export class Forward extends SmartContract {
        public forwardForward(address: Address, forwardAddress: Address, ...forwardArgs: ForwardValue[]): ForwardValue {
          const smartContract = SmartContract.for<TokenPayableContract>(address);
          forwardForwardEvent();

          return smartContract.forward(forwardAddress, ...forwardArgs);
        }

        public forwardForwardReturn(address: Address, forwardAddress: Address): ForwardValue {
          const smartContract = SmartContract.for<TokenPayableContract>(address);
          forwardForwardEvent();

          return smartContract.forwardReturn(forwardAddress);
        }

        @constant
        public forwardForwardConstant(address: Address, forwardAddress: Address, ...forwardArgs: ForwardValue[]): ForwardValue {
          const smartContract = SmartContract.for<TokenPayableContract>(address);

          return smartContract.forwardConstant(forwardAddress, ...forwardArgs);
        }

        public forward(address: Address, ...forwardArgs: ForwardValue[]): ForwardValue {
          const smartContract = SmartContract.for<TokenPayableContract>(address);
          forwardEvent();

          return smartContract.forwardTo(...forwardArgs);
        }

        public forwardReturn(address: Address): ForwardValue {
          const smartContract = SmartContract.for<TokenPayableContract>(address);
          forwardEvent();

          return smartContract.forwardToReturn(20, 3);
        }

        @constant
        public forwardConstant(address: Address, ...forwardArgs: ForwardValue[]): ForwardValue {
          const smartContract = SmartContract.for<TokenPayableContract>(address);

          return smartContract.forwardToConstant(...forwardArgs);
        }
      }
    `);

    const { contract: forwarded, definition: forwardedDefinition } = await node.addContractWithDefinition(`
      import { constant, Fixed, Integer, ForwardedValue, ForwardValue, Address, SmartContract, createEventNotifier } from '@neo-one/smart-contract';

      interface TokenPayableContract {
        readonly forwardTo: (first: number, ...args: ForwardValue[]) => ForwardValue;
        readonly forwardToReturn: (a: number, b: number) => ForwardValue;
        readonly forwardToConstant: (...args: ForwardValue[]) => ForwardValue;
      }

      const forwardedForwardEvent = createEventNotifier('forwardedForwardEvent');
      const forwardedEvent = createEventNotifier('forwardedEvent');

      export class Forwarded extends SmartContract {
        public forward(address: Address, first: ForwardedValue<Fixed<8>>, ...forwardArgs: ForwardedValue<ForwardValue>[]): ForwardedValue<ForwardValue> {
          const smartContract = SmartContract.for<TokenPayableContract>(address);
          forwardedForwardEvent();

          return smartContract.forwardTo(first, ...forwardArgs);
        }

        public forwardReturn(address: Address): ForwardedValue<ForwardValue> {
          const smartContract = SmartContract.for<TokenPayableContract>(address);
          forwardedForwardEvent();

          return smartContract.forwardToReturn(20_00000000, 3);
        }

        @constant
        public forwardConstant(address: Address, ...forwardArgs: ForwardedValue<ForwardValue>[]): ForwardedValue<ForwardValue> {
          const smartContract = SmartContract.for<TokenPayableContract>(address);

          return smartContract.forwardToConstant(...forwardArgs);
        }

        public forwardTo(first: ForwardedValue<Fixed<8>>, second: ForwardedValue<Integer>): ForwardedValue<Fixed<8>> {
          forwardedEvent();
          return first * second;
        }

        public forwardToReturn(first: Fixed<8>, second: Integer): ForwardedValue<Fixed<8>> {
          forwardedEvent();
          return first * second;
        }

        @constant
        public forwardToConstant(first: ForwardedValue<Fixed<8>>, second: ForwardedValue<Integer>): ForwardedValue<Fixed<8>> {
          return first * second;
        }
      }
    `);

    const {
      contract: forwardedForwarded,
      definition: forwardedForwardedDefinition,
    } = await node.addContractWithDefinition(`
      import { constant, Fixed, Integer, ForwardedValue, SmartContract, createEventNotifier } from '@neo-one/smart-contract';

      const forwardedForwardedEvent = createEventNotifier('forwardedForwardedEvent');

      export class ForwardedForwarded extends SmartContract {
        public forwardTo(first: Fixed<8>, second: ForwardedValue<Integer>): ForwardedValue<Fixed<8>> {
          forwardedForwardedEvent();
          return first * second;
        }

        public forwardToReturn(first: Fixed<8>, second: Integer): ForwardedValue<Fixed<8>> {
          forwardedForwardedEvent();
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

    const forwardContract = node.client.smartContract(forwardDefinition);
    const forwardedContract = node.client.smartContract(forwardedDefinition);
    const forwardedForwardedContract = node.client.smartContract(forwardedForwardedDefinition);

    const testSingle = async () => {
      const receipt = await forwardContract.forward.confirmed(
        forwarded.address,
        ...forwardedContract.forwardForwardToArgs(new BigNumber('20'), new BigNumber('3')),
      );
      if (receipt.result.state === 'FAULT') {
        throw new Error(receipt.result.message);
      }
      expect(receipt.events).toHaveLength(2);
      expect(receipt.events[0].name).toEqual('forwardEvent');
      expect(receipt.events[1].name).toEqual('forwardedEvent');
      const forwardForwardedReceipt = forwardedContract.forwardForwardToReturn(receipt);
      expect(forwardForwardedReceipt.result.value.toString()).toEqual('60');
      expect(forwardForwardedReceipt.events).toHaveLength(2);
      expect(forwardForwardedReceipt.events[0].name).toEqual('forwardEvent');
      expect(forwardForwardedReceipt.events[1].name).toEqual('forwardedEvent');

      const forwardReceipt = await forwardContract.forwardReturn.confirmed(forwarded.address);
      if (forwardReceipt.result.state === 'FAULT') {
        throw new Error(forwardReceipt.result.message);
      }
      expect(forwardReceipt.events).toHaveLength(1);
      expect(forwardReceipt.events[0].name).toEqual('forwardEvent');
      const forwardedReceipt = forwardedContract.forwardForwardToReturnReturn(receipt);
      expect(forwardedReceipt.result.value.toString()).toEqual('60');
      expect(forwardedReceipt.events).toHaveLength(2);
      expect(forwardedReceipt.events[0].name).toEqual('forwardEvent');
      expect(forwardedReceipt.events[1].name).toEqual('forwardedEvent');

      const result = await forwardContract.forwardConstant(
        forwarded.address,
        ...forwardedContract.forwardForwardToConstantArgs(new BigNumber('20'), new BigNumber('3')),
      );
      expect(forwardedContract.forwardForwardToConstantReturn(result).toString()).toEqual('60');
    };

    const testDouble = async () => {
      const receipt = await forwardContract.forwardForward.confirmed(
        forwarded.address,
        forwardedForwarded.address,
        ...forwardedContract.forwardForwardArgs(
          new BigNumber('20'),
          ...forwardedForwardedContract.forwardForwardToArgs(new BigNumber('3')),
        ),
      );
      if (receipt.result.state === 'FAULT') {
        throw new Error(receipt.result.message);
      }
      expect(receipt.events).toHaveLength(3);
      expect(receipt.events[0].name).toEqual('forwardForwardEvent');
      expect(receipt.events[1].name).toEqual('forwardedForwardEvent');
      expect(receipt.events[2].name).toEqual('forwardedForwardedEvent');
      const forwardForwardedReceipt = forwardedForwardedContract.forwardForwardToReturn(
        forwardedContract.forwardForwardReturn(receipt),
      );
      expect(forwardForwardedReceipt.result.value.toString()).toEqual('60');
      expect(forwardForwardedReceipt.events).toHaveLength(3);
      expect(forwardForwardedReceipt.events[0].name).toEqual('forwardForwardEvent');
      expect(forwardForwardedReceipt.events[1].name).toEqual('forwardedForwardEvent');
      expect(forwardForwardedReceipt.events[2].name).toEqual('forwardedForwardedEvent');

      const forwardReceipt = await forwardContract.forwardForwardReturn.confirmed(
        forwarded.address,
        forwardedForwarded.address,
      );
      if (forwardReceipt.result.state === 'FAULT') {
        throw new Error(forwardReceipt.result.message);
      }
      expect(forwardReceipt.events).toHaveLength(1);
      expect(forwardReceipt.events[0].name).toEqual('forwardForwardEvent');
      const forwardedReceipt = forwardedForwardedContract.forwardForwardToReturnReturn(
        forwardedContract.forwardForwardReturnReturn(receipt),
      );
      expect(forwardedReceipt.result.value.toString()).toEqual('60');
      expect(forwardedReceipt.events).toHaveLength(3);
      expect(forwardedReceipt.events[0].name).toEqual('forwardForwardEvent');
      expect(forwardedReceipt.events[1].name).toEqual('forwardedForwardEvent');
      expect(forwardedReceipt.events[2].name).toEqual('forwardedForwardedEvent');

      const result = await forwardContract.forwardForwardConstant(
        forwarded.address,
        forwardedForwarded.address,
        ...forwardedContract.forwardForwardConstantArgs(
          ...forwardedForwardedContract.forwardForwardToConstantArgs(new BigNumber('20'), new BigNumber('3')),
        ),
      );
      expect(
        forwardedForwardedContract
          .forwardForwardToConstantReturn(forwardedContract.forwardForwardConstantReturn(result))
          .toString(),
      ).toEqual('60');
    };

    await testSingle();
    await testDouble();
  });
});
