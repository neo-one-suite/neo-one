import { common } from '@neo-one/client-core';
import { helpers, keys } from '../../../../__data__';

describe('SetStorage', () => {
  test('add, delete, has', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { SetStorage, SmartContract, Deploy } from '@neo-one/smart-contract';

      class StorageContract implements SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'StorageContract',
          payable: true,
        };
        public readonly prefix = SetStorage.for<string>();

        public constructor(public readonly owner = Deploy.senderAddress) {}
      }

      const storage = new StorageContract().prefix;
      storage.has('foo');
      assertEqual(storage.has('foo'), false);

      assertEqual(storage.delete('foo'), false);
      storage.delete('foo');
      storage.add('foo');
      assertEqual(storage.has('foo'), true);

      assertEqual(storage.delete('foo'), true);
      assertEqual(storage.delete('foo'), false);
      assertEqual(storage.has('foo'), false);
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

  test('multi-tier', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { SetStorage, SmartContract, Deploy, Address, Hash256 } from '@neo-one/smart-contract';

      class StorageContract implements SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'StorageContract',
          payable: true,
        };
        public readonly prefix = SetStorage.for<[Address, Hash256, string]>();

        public constructor(public readonly owner = Deploy.senderAddress) {}
      }

      const addressA = Address.from('${keys[0].address}');
      const addressB = Address.from('${keys[1].address}');
      const hashA = Hash256.from('${common.NEO_ASSET_HASH}');
      const hashB = Hash256.from('${common.GAS_ASSET_HASH}');
      const keyA = 'keyA';
      const keyB = 'keyB';
      const keyC = 'keyC';

      const storage = new StorageContract().prefix;

      storage.add([addressA, hashA, keyA]);
      assertEqual(storage.has([addressA, hashA, keyA]), true);
      assertEqual(storage.at([addressA, hashA]).has(keyA), true);
      assertEqual(storage.at(addressA).has([hashA, keyA]), true);
      assertEqual(storage.at(addressA).at(hashA).has(keyA), true);
      storage.at(addressA).add([hashB, keyA])
      assertEqual(storage.has([addressA, hashB, keyA]), true);
      assertEqual(storage.at([addressA, hashB]).has(keyA), true);
      assertEqual(storage.at(addressA).has([hashB, keyA]), true);
      assertEqual(storage.at(addressA).at(hashB).has(keyA), true);
      storage.at([addressA, hashA]).add(keyB)
      assertEqual(storage.has([addressA, hashA, keyB]), true);
      assertEqual(storage.at([addressA, hashA]).has(keyB), true);
      assertEqual(storage.at(addressA).has([hashA, keyB]), true);
      assertEqual(storage.at(addressA).at(hashA).has(keyB), true);
      storage.delete([addressA, hashB, keyA]);
      storage.delete([addressA, hashA, keyB]);

      storage.add([addressA, hashA, keyA]);
      assertEqual(storage.has([addressA, hashA, keyA]), true);
      assertEqual(storage.at([addressA, hashA]).has(keyA), true);
      assertEqual(storage.at(addressA).has([hashA, keyA]), true);
      assertEqual(storage.at(addressA).at(hashA).has(keyA), true);
      storage.delete([addressA, hashA, keyA]);
      assertEqual(storage.has([addressA, hashA, keyA]), false);
      assertEqual(storage.at([addressA, hashA]).has(keyA), false);
      assertEqual(storage.at(addressA).has([hashA, keyA]), false);
      assertEqual(storage.at(addressA).at(hashA).has(keyA), false);
      storage.at(addressA).add([hashA, keyA])
      assertEqual(storage.has([addressA, hashA, keyA]), true);
      assertEqual(storage.at([addressA, hashA]).has(keyA), true);
      assertEqual(storage.at(addressA).has([hashA, keyA]), true);
      assertEqual(storage.at(addressA).at(hashA).has(keyA), true);
      storage.at(addressA).delete([hashA, keyA])
      assertEqual(storage.has([addressA, hashA, keyA]), false);
      assertEqual(storage.at([addressA, hashA]).has(keyA), false);
      assertEqual(storage.at(addressA).has([hashA, keyA]), false);
      assertEqual(storage.at(addressA).at(hashA).has(keyA), false);
      storage.at([addressA, hashA]).add(keyA)
      assertEqual(storage.has([addressA, hashA, keyA]), true);
      assertEqual(storage.at([addressA, hashA]).has(keyA), true);
      assertEqual(storage.at(addressA).has([hashA, keyA]), true);
      assertEqual(storage.at(addressA).at(hashA).has(keyA), true);
      storage.at([addressA, hashA]).delete(keyA)
      assertEqual(storage.has([addressA, hashA, keyA]), false);
      assertEqual(storage.at([addressA, hashA]).has(keyA), false);
      assertEqual(storage.at(addressA).has([hashA, keyA]), false);
      assertEqual(storage.at(addressA).at(hashA).has(keyA), false);

      storage.add([addressA, hashA, keyA]);
      storage.add([addressA, hashB, keyB]);
      storage.add([addressB, hashB, keyB]);
      storage.add([addressB, hashB, keyB]);
      storage.add([addressB, hashB, keyC]);
      storage.add([addressB, hashB, keyC]);

      let count = 0;
      let addresses = Buffer.from('', 'hex');
      let hashes = Buffer.from('', 'hex');
      let keys = '';
      storage.forEach((key) => {
        count += 1;
        addresses = Buffer.concat([addresses, key[0]]);
        hashes = Buffer.concat([hashes, key[1]]);
        keys += key[2];
      });
      assertEqual(count, 4);
      assertEqual(addresses.equals(Buffer.concat([addressA, addressA, addressB, addressB])), true);
      assertEqual(hashes.equals(Buffer.concat([hashA, hashB, hashB, hashB])), true);
      assertEqual(keys, keyA + keyB + keyB + keyC);

      count = 0;
      addresses = Buffer.from('', 'hex');
      hashes = Buffer.from('', 'hex');
      keys = '';
      for (const key of storage) {
        count += 1;
        addresses = Buffer.concat([addresses, key[0]]);
        hashes = Buffer.concat([hashes, key[1]]);
        keys += key[2];
      }
      assertEqual(count, 4);
      assertEqual(addresses.equals(Buffer.concat([addressA, addressA, addressB, addressB])), true);
      assertEqual(hashes.equals(Buffer.concat([hashA, hashB, hashB, hashB])), true);
      assertEqual(keys, keyA + keyB + keyB + keyC);

      storage[Symbol.iterator]();
      const firstIterator = storage[Symbol.iterator]();

      let firstResult = firstIterator.next();
      assertEqual(firstResult.value[0].equals(addressA), true);
      assertEqual(firstResult.value[1].equals(hashA), true);
      assertEqual(firstResult.value[2], keyA);
      assertEqual(firstResult.done, false);
      firstResult = firstIterator.next();
      assertEqual(firstResult.value[0].equals(addressA), true);
      assertEqual(firstResult.value[1].equals(hashB), true);
      assertEqual(firstResult.value[2], keyB);
      assertEqual(firstResult.done, false);
      firstResult = firstIterator.next();
      assertEqual(firstResult.value[0].equals(addressB), true);
      assertEqual(firstResult.value[1].equals(hashB), true);
      assertEqual(firstResult.value[2], keyB);
      assertEqual(firstResult.done, false);
      firstResult = firstIterator.next();
      assertEqual(firstResult.value[0].equals(addressB), true);
      assertEqual(firstResult.value[1].equals(hashB), true);
      assertEqual(firstResult.value[2], keyC);
      assertEqual(firstResult.done, false);
      firstResult = firstIterator.next();
      assertEqual(firstResult.value as [Address, Hash256, string] | undefined, undefined);
      assertEqual(firstResult.done, true);

      count = 0;
      hashes = Buffer.from('', 'hex');
      keys = '';
      storage.at(addressA).forEach((key) => {
        count += 1;
        hashes = Buffer.concat([hashes, key[0]]);
        keys += key[1];
      });
      assertEqual(count, 2);
      assertEqual(hashes.equals(Buffer.concat([hashA, hashB])), true);
      assertEqual(keys, keyA + keyB);

      const secondIterator = storage.at(addressA)[Symbol.iterator]();

      let secondResult = secondIterator.next();
      assertEqual(secondResult.value[0].equals(hashA), true);
      assertEqual(secondResult.value[1], keyA);
      assertEqual(secondResult.done, false);
      secondResult = secondIterator.next();
      assertEqual(secondResult.value[0].equals(hashB), true);
      assertEqual(secondResult.value[1], keyB);
      assertEqual(secondResult.done, false);
      secondResult = secondIterator.next();
      assertEqual(secondResult.value as [Hash256, string] | undefined, undefined);
      assertEqual(secondResult.done, true);

      count = 0;
      hashes = Buffer.from('', 'hex');
      keys = '';
      for (const key of storage.at(addressA)) {
        count += 1;
        hashes = Buffer.concat([hashes, key[0]]);
        keys += key[1];
      }
      assertEqual(count, 2);
      assertEqual(hashes.equals(Buffer.concat([hashA, hashB])), true);
      assertEqual(keys, keyA + keyB);

      count = 0;
      hashes = Buffer.from('', 'hex');
      keys = '';
      storage.at(addressB).forEach((key) => {
        count += 1;
        hashes = Buffer.concat([hashes, key[0]]);
        keys += key[1];
      });
      assertEqual(count, 2);
      assertEqual(hashes.equals(Buffer.concat([hashB, hashB])), true);
      assertEqual(keys, keyB + keyC);

      const thirdIterator = storage.at(addressB)[Symbol.iterator]();
      let thirdResult = thirdIterator.next();
      assertEqual(thirdResult.value[0].equals(hashB), true);
      assertEqual(thirdResult.value[1], keyB);
      assertEqual(thirdResult.done, false);
      thirdResult = thirdIterator.next();
      assertEqual(thirdResult.value[0].equals(hashB), true);
      assertEqual(thirdResult.value[1], keyC);
      assertEqual(thirdResult.done, false);
      thirdResult = thirdIterator.next();
      assertEqual(thirdResult.value as [Hash256, string] | undefined, undefined);
      assertEqual(thirdResult.done, true);

      count = 0;
      hashes = Buffer.from('', 'hex');
      keys = '';
      for (const key of storage.at(addressB)) {
        count += 1;
        hashes = Buffer.concat([hashes, key[0]]);
        keys += key[1];
      }
      assertEqual(count, 2);
      assertEqual(hashes.equals(Buffer.concat([hashB, hashB])), true);
      assertEqual(keys, keyB + keyC);

      count = 0;
      keys = '';
      storage.at([addressA, hashA]).forEach((key) => {
        count += 1;
        keys += key;
      });
      assertEqual(count, 1);
      assertEqual(keys, keyA);

      const fourthIterator = storage.at([addressA, hashA])[Symbol.iterator]();
      let fourthResult = fourthIterator.next();
      assertEqual(fourthResult.value, keyA);
      assertEqual(fourthResult.done, false);
      fourthResult = fourthIterator.next();
      assertEqual(fourthResult.value as string | undefined, undefined);
      assertEqual(fourthResult.done, true);

      count = 0;
      keys = '';
      for (const key of storage.at([addressA, hashA])) {
        count += 1;
        keys += key;
      }
      assertEqual(count, 1);
      assertEqual(keys, keyA);

      count = 0;
      keys = '';
      storage.at([addressA, hashB]).forEach((key) => {
        count += 1;
        keys += key;
      });
      assertEqual(count, 1);
      assertEqual(keys, keyB);

      const fifthIterator = storage.at([addressA, hashB])[Symbol.iterator]();
      let fifthResult = fifthIterator.next();
      assertEqual(fifthResult.value, keyB);
      assertEqual(fifthResult.done, false);
      fifthResult = fifthIterator.next();
      assertEqual(fifthResult.value as string | undefined, undefined);
      assertEqual(fifthResult.done, true);

      count = 0;
      keys = '';
      for (const key of storage.at([addressA, hashB])) {
        count += 1;
        keys += key;
      }
      assertEqual(count, 1);
      assertEqual(keys, keyB);

      count = 0;
      keys = '';
      storage.at([addressB, hashA]).forEach((key) => {
        count += 1;
        keys += key;
      });
      assertEqual(count, 0);
      assertEqual(keys, '');

      const sixthIterator = storage.at([addressB, hashA])[Symbol.iterator]();
      let sixthResult = sixthIterator.next();
      assertEqual(sixthResult.value as string | undefined, undefined);
      assertEqual(sixthResult.done, true);

      count = 0;
      keys = '';
      for (const key of storage.at([addressB, hashA])) {
        count += 1;
        keys += key;
      }
      assertEqual(count, 0);
      assertEqual(keys, '');

      count = 0;
      keys = '';
      storage.at([addressB, hashB]).forEach((key) => {
        count += 1;
        keys += key;
      });
      assertEqual(count, 2);
      assertEqual(keys, keyB + keyC);

      const seventhIterator = storage.at([addressB, hashB])[Symbol.iterator]();
      let seventhResult = seventhIterator.next();
      assertEqual(seventhResult.value, keyB);
      assertEqual(seventhResult.done, false);
      seventhResult = seventhIterator.next();
      assertEqual(seventhResult.value, keyC);
      assertEqual(seventhResult.done, false);
      seventhResult = seventhIterator.next();
      assertEqual(seventhResult.value as string | undefined, undefined);
      assertEqual(seventhResult.done, true);

      count = 0;
      keys = '';
      for (const key of storage.at([addressB, hashB])) {
        count += 1;
        keys += key;
      }
      assertEqual(count, 2);
      assertEqual(keys, keyB + keyC);
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
