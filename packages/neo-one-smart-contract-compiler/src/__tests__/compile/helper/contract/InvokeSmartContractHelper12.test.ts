import { helpers } from '../../../../__data__';

describe('InvokeSmartContractHelper', () => {
  const createIterSetContract = async (node: helpers.TestNode) =>
    node.addContract(`
    import { SetStorage, SmartContract } from '@neo-one/smart-contract';

    const keyA = 'keyA';
    const keyB = 'keyB';
    const keyC = 'keyC';

    export class TestSmartContract extends SmartContract {
      private readonly storage = SetStorage.for<string>();

      public setup(): boolean {
        this.storage.add(keyA);
        this.storage.add(keyB);
        this.storage.add(keyC);

        return true;
      }

      public testDeleteAndIter(): boolean {
        assertEqual(this.storage.delete(keyB), true);

        let count = 0;
        let keys = '';
        this.storage.forEach((key) => {
          count += 1;
          keys += key;
        });
        assertEqual(count, 2);
        assertEqual(keys, keyA + keyC);

        count = 0;
        keys = '';
        for (const key of this.storage) {
          count += 1;
          keys += key;
        }
        assertEqual(count, 2);
        assertEqual(keys, keyA + keyC);

        this.storage[Symbol.iterator]();
        const firstIterator = this.storage[Symbol.iterator]();

        let firstResult = firstIterator.next();
        assertEqual(firstResult.value, keyA);
        assertEqual(firstResult.done, false);
        firstResult = firstIterator.next();
        assertEqual(firstResult.value, keyC);
        assertEqual(firstResult.done, false);
        firstResult = firstIterator.next();
        assertEqual(firstResult.value as string | undefined, undefined);
        assertEqual(firstResult.done, true);

        const foo = (x: string, ...y: string[]): string => y.reduce((acc, value) => acc + value, x);

        assertEqual(foo('foo', ...this.storage), 'foo' + keyA + keyC);
        assertEqual(foo('foo', 'bar', ...this.storage), 'foobar' + keyA + keyC);

        return true;
      }
    }
  `);

  test('in memory delete of set storage then iterate', async () => {
    const node = await helpers.startNode();
    const contract = await createIterSetContract(node);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        setup(): boolean;
        testDeleteAndIter(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.setup(), true);
      assertEqual(contract.testDeleteAndIter(), true);
    `);
  });

  test('in memory delete of set storage then iterate in separate transaction', async () => {
    const node = await helpers.startNode();
    const contract = await createIterSetContract(node);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        setup(): boolean;
        testDeleteAndIter(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.setup(), true);
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        setup(): boolean;
        testDeleteAndIter(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.testDeleteAndIter(), true);
    `);
  });

  const createIterArrayContract = async (node: helpers.TestNode) =>
    node.addContract(`
    import { ArrayStorage, SmartContract } from '@neo-one/smart-contract';

    const keyA = 'keyA';
    const keyB = 'keyB';
    const keyC = 'keyC';

    export class TestSmartContract extends SmartContract {
      private readonly storage = ArrayStorage.for<string>();

      public setup(): boolean {
        this.storage.push(keyA);
        this.storage.push(keyB);
        this.storage.push(keyC);

        return true;
      }

      public testDeleteAndIter(): boolean {
        assertEqual(this.storage.pop(), keyC);

        let count = 0;
        let keys = '';
        this.storage.forEach((key) => {
          count += 1;
          keys += key;
        });
        assertEqual(count, 2);
        assertEqual(keys, keyA + keyB);

        count = 0;
        keys = '';
        for (const key of this.storage) {
          count += 1;
          keys += key;
        }
        assertEqual(count, 2);
        assertEqual(keys, keyA + keyB);

        this.storage[Symbol.iterator]();
        const firstIterator = this.storage[Symbol.iterator]();

        let firstResult = firstIterator.next();
        assertEqual(firstResult.value, keyA);
        assertEqual(firstResult.done, false);
        firstResult = firstIterator.next();
        assertEqual(firstResult.value, keyB);
        assertEqual(firstResult.done, false);
        firstResult = firstIterator.next();
        assertEqual(firstResult.value as string | undefined, undefined);
        assertEqual(firstResult.done, true);

        const foo = (x: string, ...y: string[]): string => y.reduce((acc, value) => acc + value, x);

        assertEqual(foo('foo', ...this.storage), 'foo' + keyA + keyB);
        assertEqual(foo('foo', 'bar', ...this.storage), 'foobar' + keyA + keyB);

        return true;
      }
    }
  `);

  test('in memory delete of array storage then iterate', async () => {
    const node = await helpers.startNode();
    const contract = await createIterArrayContract(node);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        setup(): boolean;
        testDeleteAndIter(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.setup(), true);
      assertEqual(contract.testDeleteAndIter(), true);
    `);
  });

  test('in memory delete of array storage then iterate in separate transaction', async () => {
    const node = await helpers.startNode();
    const contract = await createIterArrayContract(node);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        setup(): boolean;
        testDeleteAndIter(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.setup(), true);
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        setup(): boolean;
        testDeleteAndIter(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.testDeleteAndIter(), true);
    `);
  });
});
