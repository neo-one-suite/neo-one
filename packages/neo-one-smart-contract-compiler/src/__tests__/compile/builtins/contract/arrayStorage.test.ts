import { helpers } from '../../../../__data__';

describe('ArrayStorage', () => {
  test('length, push, pop, index', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { ArrayStorage, SmartContract, Deploy } from '@neo-one/smart-contract';

      class StorageContract implements SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'StorageContract',
          payable: true,
        };
        public readonly prefix = ArrayStorage.for<string>();

        public constructor(public readonly owner = Deploy.senderAddress) {}
      }

      const storage = new StorageContract().prefix;
      assertEqual(storage.length, 0);

      storage[0] = '10';
      assertEqual(storage[0], '10');
      assertEqual(storage[1] as string | undefined, undefined);
      assertEqual(storage.length, 1);

      storage.push('11', '12', '13');
      assertEqual(storage[0], '10');
      assertEqual(storage[1], '11');
      assertEqual(storage[2], '12');
      assertEqual(storage[3], '13');
      assertEqual(storage.length, 4);
      assertEqual(storage.pop(), '13');
      assertEqual(storage.length, 3);
      assertEqual(storage.pop(), '12');
      assertEqual(storage.length, 2);
      storage.pop();
      assertEqual(storage.length, 1);
      assertEqual(storage.pop(), '10');
      assertEqual(storage.length, 0);
      assertEqual(storage.pop(), undefined);
      assertEqual(storage.length, 0);
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        run(): void;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));
      contract.run();
    `);
  });

  test('iteration', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { ArrayStorage, SmartContract, Deploy } from '@neo-one/smart-contract';

      class StorageContract implements SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'StorageContract',
          payable: true,
        };
        public readonly prefix = ArrayStorage.for<string>();

        public constructor(public readonly owner = Deploy.senderAddress) {}
      }

      const keyA = 'keyA';
      const keyB = 'keyB';
      const keyC = 'keyC';
      const keyD = 'keyD';

      const storage = new StorageContract().prefix;
      storage.push(keyA, keyB);
      const result = storage.push(keyC);
      storage.push(keyD);

      assertEqual(result, 3);

      let count = 0;
      let indices = 0;
      let keys = '';
      storage.forEach((key, idx) => {
        count += 1;
        indices += idx;
        keys += key;
      });
      assertEqual(count, 4);
      assertEqual(indices, 6);
      assertEqual(keys, keyA + keyB + keyC + keyD);

      count = 0;
      keys = '';
      for (const key of storage) {
        count += 1;
        keys += key;
      }
      assertEqual(count, 4);
      assertEqual(keys, keyA + keyB + keyC + keyD);

      storage[Symbol.iterator]();
      const firstIterator = storage[Symbol.iterator]();

      let firstResult = firstIterator.next();
      assertEqual(firstResult.value, keyA);
      assertEqual(firstResult.done, false);
      firstResult = firstIterator.next();
      assertEqual(firstResult.value, keyB);
      assertEqual(firstResult.done, false);
      firstResult = firstIterator.next();
      assertEqual(firstResult.value, keyC);
      assertEqual(firstResult.done, false);
      firstResult = firstIterator.next();
      assertEqual(firstResult.value, keyD);
      assertEqual(firstResult.done, false);
      firstResult = firstIterator.next();
      assertEqual(firstResult.value as string | undefined, undefined);
      assertEqual(firstResult.done, true);
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        run(): void;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));
      contract.run();
    `);
  });
});
