import {
  common,
  AttributeUsage,
  TransactionType,
  AssetType,
  ContractParameterType,
  ContractPropertyState,
  crypto,
} from '@neo-one/client-core';
import { helpers, keys } from '../../__data__';
import BigNumber from 'bignumber.js';
import { Attribute, Input, Output, addressToScriptHash } from '@neo-one/client';

const getUInt160Hash = (value: string) => `Buffer.from('${common.stringToUInt160(value).toString('hex')}', 'hex')`;
const getUInt256Hash = (value: string) => `Buffer.from('${common.stringToUInt256(value).toString('hex')}', 'hex')`;
const getAddressHash = (value: string) => getUInt160Hash(addressToScriptHash(value));
const getBufferHash = (value: string) => `Buffer.from('${value}', 'hex')`;
const getDecimal = (value: BigNumber) => common.fixed8FromDecimal(value).toString(10);

describe('syscalls', () => {
  test('Neo.Runtime.GetTrigger', async () => {
    await helpers.executeString(`
      if (syscall('Neo.Runtime.GetTrigger') !== 0x10) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Runtime.CheckWitness', async () => {
    const node = await helpers.startNode();
    const hash = common.stringToUInt160(node.masterWallet.account.scriptHash).toString('hex');
    await node.executeString(`
      if (!syscall('Neo.Runtime.CheckWitness', Buffer.from('${hash}', 'hex'))) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Runtime.Notify', async () => {
    const node = await helpers.startNode();
    const { receipt: result } = await node.executeString(`
      syscall('Neo.Runtime.Notify', 'event', 10, 'foo', true);
    `);

    expect(result.actions.length).toEqual(1);
    const action = result.actions[0];
    if (action.type !== 'Notification') {
      expect(action.type).toEqual('Notification');
      throw new Error('For TS');
    }
    expect(action.args.length).toEqual(4);

    const expectArg = (arg: any, type: string, value: any, mapValue: (val: any) => any) => {
      expect(arg.type).toEqual(type);
      expect(mapValue(arg.value)).toEqual(value);
    };
    expectArg(action.args[0], 'ByteArray', 'event', (val) => Buffer.from(val, 'hex').toString('utf8'));
    expectArg(action.args[1], 'Integer', '10', (val) => val.toString(10));
    expectArg(action.args[2], 'ByteArray', 'foo', (val) => Buffer.from(val, 'hex').toString('utf8'));
    expectArg(action.args[3], 'Integer', '1', (val) => val.toString(10));
  });

  test('Neo.Runtime.Log', async () => {
    const node = await helpers.startNode();
    const { receipt: result } = await node.executeString(`
      syscall('Neo.Runtime.Log', 'hello world');
    `);

    expect(result.actions.length).toEqual(1);
    const action = result.actions[0];
    if (action.type !== 'Log') {
      expect(action.type).toEqual('Log');
      throw new Error('For TS');
    }
    expect(action.message).toEqual('hello world');
  });

  test('Neo.Runtime.GetTime', async () => {
    await helpers.executeString(`
      if (syscall('Neo.Runtime.GetTime') === undefined) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Runtime.Serialize/Deserialize array', async () => {
    await helpers.executeString(`
      const foo = [1, 2, 3];
      const serialized = syscall('Neo.Runtime.Serialize', foo);
      const deserialized = (syscall('Neo.Runtime.Deserialize', serialized) as Array<number>);

      if (deserialized[0] !== 1) {
        throw 'Failure';
      }

      if (deserialized[1] !== 2) {
        throw 'Failure';
      }

      if (deserialized[2] !== 3) {
        throw 'Failure';
      }

      if (deserialized.length !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Runtime.Serialize/Deserialize generic', async () => {
    await helpers.executeString(
      `
      class Serializer<V extends SerializableValue> {
        public serialize(value: V): Buffer {
          return syscall('Neo.Runtime.Serialize', value);
        }

        public deserialize(value: Buffer): V {
          return (syscall('Neo.Runtime.Deserialize', value) as V);
        }
      }

      const serializer = new Serializer<Array<Array<number | boolean>>>();

      const foo = [[1], [2, true], [false, 3]];
      const serialized = serializer.serialize(foo);
      const deserialized = serializer.deserialize(serialized);

      if (deserialized[0][0] !== 1) {
        throw 'Failure';
      }

      if (deserialized[1][0] !== 2) {
        throw 'Failure';
      }

      if (deserialized[1][1] !== true) {
        throw 'Failure';
      }

      if (deserialized[2][0] !== false) {
        throw 'Failure';
      }

      if (deserialized[2][1] !== 3) {
        throw 'Failure';
      }
    `,
      { ignoreWarnings: true },
    );
  });

  test('Neo.Blockchain.GetHeight', async () => {
    const node = await helpers.startNode();
    await node.developerClient.reset();
    await Promise.all([node.readClient.getBlock(1, { timeoutMS: 1250 })]);
    await node.executeString(`
      const height = syscall('Neo.Blockchain.GetHeight');
      if (height !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Blockchain.GetHeader and related', async () => {
    const node = await helpers.startNode();
    await node.executeString(`
      const header = syscall('Neo.Blockchain.GetHeader', 0);

      if (!syscall('Neo.Header.GetHash', header).equals(Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex'))) {
        throw 'Failure';
      }

      if (!syscall('Neo.Header.GetVersion', header) === 0) {
        throw 'Failure';
      }

      if (!syscall('Neo.Header.GetPrevHash', header).equals(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'))) {
        throw 'Failure';
      }

      if (!syscall('Neo.Header.GetIndex', header) === 0) {
        throw 'Failure';
      }

      if (!syscall('Neo.Header.GetMerkleRoot', header).equals(Buffer.from('b9c6501ee016782cce7317f8bc64be6c42b7262b25e7f7b1e0352b240e79ff1a', 'hex'))) {
        throw 'Failure';
      }

      if (syscall('Neo.Header.GetTimestamp', header) !== 1468595301) {
        throw 'Failure';
      }

      if (syscall('Neo.Header.GetConsensusData', header) !== 2083236893) {
        throw 'Failure';
      }

      if (!syscall('Neo.Header.GetNextConsensus', header).equals(Buffer.from('e085b16cb6d0d949beb7a9244d9527c272d9c8f5', 'hex'))) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Blockchain.GetBlock and related', async () => {
    const node = await helpers.startNode();
    await node.executeString(`
      const block = syscall('Neo.Blockchain.GetBlock', 0);

      if (!syscall('Neo.Header.GetHash', block).equals(Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex'))) {
        throw 'Failure';
      }

      if (!syscall('Neo.Header.GetVersion', block) === 0) {
        throw 'Failure';
      }

      if (!syscall('Neo.Header.GetPrevHash', block).equals(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'))) {
        throw 'Failure';
      }

      if (!syscall('Neo.Header.GetIndex', block) === 0) {
        throw 'Failure';
      }

      if (!syscall('Neo.Header.GetMerkleRoot', block).equals(Buffer.from('b9c6501ee016782cce7317f8bc64be6c42b7262b25e7f7b1e0352b240e79ff1a', 'hex'))) {
        throw 'Failure';
      }

      if (syscall('Neo.Header.GetTimestamp', block) !== 1468595301) {
        throw 'Failure';
      }

      if (syscall('Neo.Header.GetConsensusData', block) !== 2083236893) {
        throw 'Failure';
      }

      if (!syscall('Neo.Header.GetNextConsensus', block).equals(Buffer.from('e085b16cb6d0d949beb7a9244d9527c272d9c8f5', 'hex'))) {
        throw 'Failure';
      }

      if (syscall('Neo.Block.GetTransactionCount', block) !== 5) {
        throw 'Failure';
      }

      if (syscall('Neo.Block.GetTransactions', block).length !== 5) {
        throw 'Failure';
      }

      let transaction = syscall('Neo.Block.GetTransaction', block, 0);
      if (!syscall('Neo.Transaction.GetHash', transaction).equals(Buffer.from('d6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb', 'hex'))) {
        throw 'Failure';
      }

      transaction = syscall('Neo.Block.GetTransaction', block, 1);
      if (!syscall('Neo.Transaction.GetHash', transaction).equals(Buffer.from('9b7cffdaa674beae0f930ebe6085af9093e5fe56b34a5c220ccdcf6efc336fc5', 'hex'))) {
        throw 'Failure';
      }

      transaction = syscall('Neo.Block.GetTransaction', block, 2);
      if (!syscall('Neo.Transaction.GetHash', transaction).equals(Buffer.from('e72d286979ee6cb1b7e65dfddfb2e384100b8d148e7758de42e4168b71792c60', 'hex'))) {
        throw 'Failure';
      }

      transaction = syscall('Neo.Block.GetTransaction', block, 3);
      if (!syscall('Neo.Transaction.GetHash', transaction).equals(Buffer.from('08d2cfa8afca37cec5e93909441f6a1cb534430e9eafbe4b9e0cf77739a06f3d', 'hex'))) {
        throw 'Failure';
      }

      transaction = syscall('Neo.Block.GetTransaction', block, 4);
      if (!syscall('Neo.Transaction.GetHash', transaction).equals(Buffer.from('3a3f43c1d327df0f78ca58ff1b834e927e27824e6e618d56cb6995af5a71fb31', 'hex'))) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Blockchain.GetTransaction and related', async () => {
    const node = await helpers.startNode();

    const { transaction } = await node.executeString(
      `
      const transaction = syscall('Neo.Blockchain.GetTransaction', Buffer.from('d6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb', 'hex'));

      if (syscall('Neo.Transaction.GetType', transaction) !== ${TransactionType.Miner}) {
        throw 'Failure';
      }
    `,
      {
        transfers: [
          {
            to: keys[0].address,
            amount: new BigNumber(10),
            asset: common.NEO_ASSET_HASH,
          },
        ],
        attributes: [
          {
            usage: 'Description',
            data: Buffer.from('Hello World', 'utf8').toString('hex'),
          },
        ],
      },
    );

    const getUsage = (attribute: Attribute) => AttributeUsage[attribute.usage];

    const checkAttribute = (idx: number, attribute: Attribute) => `
      attribute = attributes[${idx}];

      if (syscall('Neo.Attribute.GetUsage', attribute) !== ${getUsage(attribute)}) {
        throw 'Failure';
      }

      if (!syscall('Neo.Attribute.GetData', attribute).equals(Buffer.from('${attribute.data}', 'hex'))) {
        throw 'Failure';
      }
    `;

    const checkInput = (idx: number, input: Input) => `
      input = inputs[${idx}];

      if (!syscall('Neo.Input.GetHash', input).equals(${getUInt256Hash(input.txid)})) {
        throw 'Failure';
      }

      if (syscall('Neo.Input.GetIndex', input) !== ${input.vout}) {
        throw 'Failure';
      }
    `;

    const checkOutput = (idx: number, output: Output) => `
      output = outputs[${idx}];

      if (!syscall('Neo.Output.GetAssetId', output).equals(${getUInt256Hash(output.asset)})) {
        throw 'Failure';
      }

      if (syscall('Neo.Output.GetValue', output) !== ${getDecimal(output.value)}) {
        throw 'Failure';
      }

      if (!syscall('Neo.Output.GetScriptHash', output).equals(${getAddressHash(output.address)})) {
        throw 'Failure';
      }
    `;

    const references = await Promise.all(transaction.vin.map(async (input) => node.readClient.getOutput(input)));

    await node.executeString(`
      const transaction = syscall('Neo.Blockchain.GetTransaction', ${getUInt256Hash(transaction.txid)});

      if (!syscall('Neo.InvocationTransaction.GetScript', transaction).equals(Buffer.from('${
        transaction.script
      }', 'hex'))) {
        throw 'Failure';
      }

      if (syscall('Neo.Transaction.GetType', transaction) !== ${TransactionType.Invocation}) {
        throw 'Failure';
      }

      const attributes = syscall('Neo.Transaction.GetAttributes', transaction);
      if (attributes.length !== ${transaction.attributes.length}) {
        throw 'Failure';
      }

      let attribute: AttributeBase;
      ${transaction.attributes.map((attribute, idx) => checkAttribute(idx, attribute)).join('')}

      const inputs = syscall('Neo.Transaction.GetInputs', transaction);
      if (inputs.length !== ${transaction.vin.length}) {
        throw 'Failure';
      }

      let input: InputBase;
      ${transaction.vin.map((input, idx) => checkInput(idx, input)).join('')}

      let outputs = syscall('Neo.Transaction.GetOutputs', transaction);
      if (outputs.length !== ${transaction.vout.length}) {
        throw 'Failure';
      }

      let output: OutputBase;
      ${transaction.vout.map((output, idx) => checkOutput(idx, output)).join('')}

      outputs = syscall('Neo.Transaction.GetUnspentCoins', transaction);
      if (outputs.length !== ${transaction.vout.length}) {
        throw 'Failure';
      }

      ${transaction.vout.map((output, idx) => checkOutput(idx, output)).join('')}

      outputs = syscall('Neo.Transaction.GetReferences', transaction);
      if (outputs.length !== ${references.length}) {
        throw 'Failure';
      }

      ${references.map((output, idx) => checkOutput(idx, output)).join('')}
    `);
  });

  test('Neo.Blockchain.GetTransactionHeight', async () => {
    const node = await helpers.startNode();
    await node.executeString(`
      if (syscall('Neo.Blockchain.GetTransactionHeight', Buffer.from('3a3f43c1d327df0f78ca58ff1b834e927e27824e6e618d56cb6995af5a71fb31', 'hex')) !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Blockchain.GetAccount and related', async () => {
    const node = await helpers.startNode();
    const account = await node.readClient.getAccount(node.masterWallet.account.id.address);
    await node.executeString(`
      const account = syscall('Neo.Blockchain.GetAccount', ${getAddressHash(account.address)});

      if (!syscall('Neo.Account.GetScriptHash', account).equals(${getAddressHash(account.address)})) {
        throw 'Failure';
      }

      if (syscall('Neo.Account.GetBalance', account, ${getUInt256Hash(common.NEO_ASSET_HASH)}) !== ${getDecimal(
      account.balances[common.NEO_ASSET_HASH],
    )}) {
        throw 'Failure';
      }

      if (syscall('Neo.Account.GetBalance', account, ${getUInt256Hash(common.GAS_ASSET_HASH)}) !== ${getDecimal(
      account.balances[common.GAS_ASSET_HASH],
    )}) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Blockchain.GetAsset and related', async () => {
    const node = await helpers.startNode();
    const asset = await node.readClient.getAsset(common.NEO_ASSET_HASH);
    await node.executeString(`
      const asset = syscall('Neo.Blockchain.GetAsset', ${getUInt256Hash(common.NEO_ASSET_HASH)});

      if (!syscall('Neo.Asset.GetAssetId', asset).equals(${getUInt256Hash(asset.hash)})) {
        throw 'Failure';
      }

      if (syscall('Neo.Asset.GetAssetType', asset) !== ${AssetType[asset.type]}) {
        throw 'Failure';
      }

      if (syscall('Neo.Asset.GetAmount', asset) !== ${getDecimal(asset.amount)}) {
        throw 'Failure';
      }

      if (syscall('Neo.Asset.GetAvailable', asset) !== ${getDecimal(asset.available)}) {
        throw 'Failure';
      }

      if (syscall('Neo.Asset.GetPrecision', asset) !== ${asset.precision}) {
        throw 'Failure';
      }

      if (!syscall('Neo.Asset.GetOwner', asset).equals(${getBufferHash(asset.owner)})) {
        throw 'Failure';
      }

      if (!syscall('Neo.Asset.GetAdmin', asset).equals(${getAddressHash(asset.admin)})) {
        throw 'Failure';
      }

      if (!syscall('Neo.Asset.GetIssuer', asset).equals(${getAddressHash(asset.issuer)})) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Blockchain.GetContract and related', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      const x = syscall('Neo.Runtime.GetArgument', 0) as number;
      const y = syscall('Neo.Runtime.GetArgument', 1) as number;
      syscall('Neo.Runtime.Return', x * y);
    `);
    await node.executeString(`
      const contract = syscall('Neo.Blockchain.GetContract', ${getUInt160Hash(contract.hash)});

      if (!syscall('Neo.Contract.GetScript', contract).equals(${getBufferHash(contract.script)})) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Storage + Neo.Runtime.Call', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      const context = syscall('Neo.Storage.GetContext');
      const readOnlyContext = syscall('Neo.StorageContext.AsReadOnly', context);

      const oldX = (syscall('Neo.Storage.Get', readOnlyContext, 'x') as number | undefined) || 0;
      const oldY = (syscall('Neo.Storage.Get', readOnlyContext, 'y') as number | undefined) || 0;

      syscall('Neo.Storage.Delete', context, 'x');
      syscall('Neo.Storage.Delete', context, 'y');

      if (syscall('Neo.Storage.Get', readOnlyContext, 'x') as number | undefined !== undefined) {
        throw 'Failure';
      }
      if (syscall('Neo.Storage.Get', readOnlyContext, 'y') as number | undefined !== undefined) {
        throw 'Failure';
      }

      const x = syscall('Neo.Runtime.GetArgument', 0) as number;
      const y = syscall('Neo.Runtime.GetArgument', 1) as number;
      syscall('Neo.Storage.Put', context, 'x', x);
      syscall('Neo.Storage.Put', context, 'y', y);

      syscall('Neo.Runtime.Return', oldX * oldY);
    `);

    await node.executeString(`
      let result = syscall('Neo.Runtime.Call', ${getUInt160Hash(contract.hash)}, 0, 3) as number;
      if (result !== 0) {
        throw 'Failure';
      }

      result = syscall('Neo.Runtime.Call', ${getUInt160Hash(contract.hash)}, 5, 5) as number;
      if (result !== 0) {
        throw 'Failure';
      }

      result = syscall('Neo.Runtime.Call', ${getUInt160Hash(contract.hash)}, 4, 5) as number;
      if (result !== 25) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Contract.Migrate', async () => {
    const node = await helpers.startNode();
    const parameterList = Buffer.from([ContractParameterType.String]);

    const { code: newContract } = await node.compileScript(`
      const method = syscall('Neo.Runtime.GetArgument', 0) as string;
      if (method === 'test') {
        const context = syscall('Neo.Storage.GetReadOnlyContext');
        const x = syscall('Neo.Storage.Get', context, 'x') as number;
        const y = syscall('Neo.Storage.Get', context, 'y') as number;
        const z = syscall('Neo.Storage.Get', context, 'z') as number;
        syscall('Neo.Runtime.Return', x * y * z);
      } else if (method === 'destroy') {
        syscall('Neo.Contract.Destroy');
        syscall('Neo.Runtime.Return', true);
      }
    `);
    const newContractHash = common.uInt160ToString(crypto.toScriptHash(newContract));

    const contract = await node.addContract(`
      const method = syscall('Neo.Runtime.GetArgument', 0) as string;
      if (method === 'migrate') {
        const contract = syscall(
          'Neo.Contract.Migrate',
          ${getBufferHash(newContract.toString('hex'))},
          ${getBufferHash(parameterList.toString('hex'))},
          ${ContractParameterType.ByteArray},
          ${ContractPropertyState.HasStorageDynamicInvokePayable},
          "ContractMigrated",
          "2.0",
          "me",
          "me@me.com",
          "migrated contract"
        );
        const context = syscall('Neo.Contract.GetStorageContext', contract);
        syscall('Neo.Storage.Put', context, 'z', 10);
      } else if (method === 'deploy') {
        const context = syscall('Neo.Storage.GetContext');
        syscall('Neo.Storage.Put', context, 'x', 2);
        syscall('Neo.Storage.Put', context, 'y', 5);
      }
    `);

    await node.executeString(`
      syscall('Neo.Runtime.Call', ${getUInt160Hash(contract.hash)}, 'deploy');
      syscall('Neo.Runtime.Call', ${getUInt160Hash(contract.hash)}, 'migrate');

      const result = syscall('Neo.Runtime.Call', ${getUInt160Hash(newContractHash)}, 'test') as number;
      if (result !== 100) {
        throw 'Failure';
      }

      const destroyResult = syscall('Neo.Runtime.Call', ${getUInt160Hash(newContractHash)}, 'destroy') as boolean;
      if (!destroyResult) {
        throw 'Failure';
      }
    `);

    await expect(node.readClient.getContract(contract.hash)).rejects.toBeDefined();
    await expect(node.readClient.getContract(newContractHash)).rejects.toBeDefined();
  });

  test('Neo.Contract.Create', async () => {
    const node = await helpers.startNode();
    const parameterList = Buffer.from([ContractParameterType.String]);

    const { code: newContract } = await node.compileScript(`
      const method = syscall('Neo.Runtime.GetArgument', 0) as string;
      if (method === 'test') {
        const context = syscall('Neo.Storage.GetReadOnlyContext');
        const x = syscall('Neo.Storage.Get', context, 'x') as number;
        const y = syscall('Neo.Storage.Get', context, 'y') as number;
        const z = syscall('Neo.Storage.Get', context, 'z') as number;
        syscall('Neo.Runtime.Return', x * y * z);
      }
    `);
    const newContractHash = common.uInt160ToString(crypto.toScriptHash(newContract));

    const contract = await node.addContract(`
      const method = syscall('Neo.Runtime.GetArgument', 0) as string;
      if (method === 'create') {
        const contract = syscall(
          'Neo.Contract.Create',
          ${getBufferHash(newContract.toString('hex'))},
          ${getBufferHash(parameterList.toString('hex'))},
          ${ContractParameterType.ByteArray},
          ${ContractPropertyState.HasStorageDynamicInvokePayable},
          "ContractCreated",
          "2.0",
          "me",
          "me@me.com",
          "created contract"
        );
        const context = syscall('Neo.Contract.GetStorageContext', contract);
        syscall('Neo.Storage.Put', context, 'x', 2);
        syscall('Neo.Storage.Put', context, 'y', 5);
        syscall('Neo.Storage.Put', context, 'z', 10);
      }
    `);

    await node.executeString(`
      syscall('Neo.Runtime.Call', ${getUInt160Hash(contract.hash)}, 'create');

      const result = syscall('Neo.Runtime.Call', ${getUInt160Hash(newContractHash)}, 'test') as number;
      if (result !== 100) {
        throw 'Failure';
      }
    `);

    const createdContract = await node.readClient.getContract(newContractHash);
    expect(createdContract.script).toEqual(newContract.toString('hex'));
    expect(createdContract.parameters).toEqual(['String']);
    expect(createdContract.properties.storage).toBeTruthy();
    expect(createdContract.properties.dynamicInvoke).toBeTruthy();
    expect(createdContract.properties.payable).toBeTruthy();
    expect(createdContract.codeVersion).toEqual('2.0');
    expect(createdContract.author).toEqual('me');
    expect(createdContract.email).toEqual('me@me.com');
    expect(createdContract.description).toEqual('created contract');
  });
});
