import { helpers } from '../../../../../__data__';
import { ContractParameterType, common, crypto, ContractPropertyState } from '@neo-one/client-core';

describe('Contract functions', () => {
  test('migrate', async () => {
    const node = await helpers.startNode();
    const parameterList = Buffer.from([ContractParameterType.String]);

    const { code: newContract } = await node.compileScript(`
      import { getArgument, getStorage, doReturn, destroy } from '@neo-one/smart-contract-internal';

      const method = getArgument<string>(0);
      if (method === 'test') {
        getStorage<number>('x');
        const x = getStorage<number>('x');
        const y = getStorage<number>('y');
        const z = getStorage<number | undefined>('z');
        doReturn(x * y * (z === undefined ? 1 : 10));
      } else if (method === 'destroy') {
        destroy();
        doReturn(true);
      }
    `);
    const newContractHash = common.uInt160ToString(crypto.toScriptHash(newContract));

    const contract = await node.addContract(`
      import { getArgument, putStorage, doReturn, migrate } from '@neo-one/smart-contract-internal';
      getArgument<string>(0);
      const method = getArgument<string>(0);
      if (method === 'migrate') {
        migrate(
          ${helpers.getBufferHash(newContract.toString('hex'))},
          ${helpers.getBufferHash(parameterList.toString('hex'))},
          ${ContractParameterType.ByteArray},
          ${ContractPropertyState.HasStorageDynamicInvokePayable},
          "ContractMigrated",
          "2.0",
          "me",
          "me@me.com",
          "migrated contract"
        );
        doReturn();
      } else if (method === 'deploy') {
        putStorage('x', 2);
        putStorage('y', 5);
        doReturn();
      } else {
        doReturn(false);
      }
    `);

    await node.executeString(`
      import { Address } from '@neo-one/smart-contract';
      interface Contract {
        deploy: () => void;
        migrate: () => void;
      }
      const contract = Address.getSmartContract<Contract>(Address.from('${contract.hash}'));
      assertEqual(contract.deploy(), undefined);
      contract.migrate();

      interface NewContract {
        test: () => number;
        destroy: () => boolean;
      }

      const newContract = Address.getSmartContract<NewContract>(Address.from('${newContractHash}'));
      assertEqual(newContract.test(), 10);
      assertEqual(newContract.destroy(), true);
    `);

    await expect(node.readClient.getContract(contract.hash)).rejects.toBeDefined();
    await expect(node.readClient.getContract(newContractHash)).rejects.toBeDefined();
  });

  test('create', async () => {
    const node = await helpers.startNode();
    const parameterList = Buffer.from([ContractParameterType.String]);

    const { code: newContract } = await node.compileScript(`
      import { getArgument, doReturn } from '@neo-one/smart-contract-internal';

      const method = getArgument<string>(0);
      if (method === 'test') {
        doReturn(2 * 5);
      }
    `);
    const newContractHash = common.uInt160ToString(crypto.toScriptHash(newContract));

    const contract = await node.addContract(`
      import { getArgument, create } from '@neo-one/smart-contract-internal';
      const method = getArgument<string>(0);
      if (method === 'create') {
        const contract = create(
          ${helpers.getBufferHash(newContract.toString('hex'))},
          ${helpers.getBufferHash(parameterList.toString('hex'))},
          ${ContractParameterType.ByteArray},
          ${ContractPropertyState.HasStorageDynamicInvokePayable},
          "ContractCreated",
          "2.0",
          "me",
          "me@me.com",
          "created contract"
        );

        assertEqual(contract !== undefined, true);
      }
    `);

    await node.executeString(`
      import { Address } from '@neo-one/smart-contract';
      interface Contract {
        create: () => void;
      }
      const contract = Address.getSmartContract<Contract>(Address.from('${contract.hash}'));
      contract.create();

      interface NewContract {
        test: () => number;
      }

      const newContract = Address.getSmartContract<NewContract>(Address.from('${newContractHash}'));
      assertEqual(newContract.test(), 10);
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
