import { hashes, helpers, keys } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('SetStorage', () => {
  test('add, delete, has', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { SetStorage, SmartContract } from '@neo-one/smart-contract';

      export class StorageContract extends SmartContract {
        ${properties}

        private readonly storage = SetStorage.for<string>();

        public run(): void {
          const storage = this.storage;
          storage.has('foo');
          assertEqual(storage.has('foo'), false);
          assertEqual(storage instanceof SetStorage, true);

          assertEqual(storage.delete('foo'), false);
          storage.delete('foo');
          storage.add('foo').add('bar');
          assertEqual(storage.has('foo'), true);
          assertEqual(storage.has('bar'), true);

          storage.delete('bar');
          assertEqual(storage.delete('foo'), true);
          assertEqual(storage.delete('foo'), false);
          assertEqual(storage.has('foo'), false);
          assertEqual(storage.has('bar'), false);

          interface Storage<V> {
            has(value: V): boolean;
            add(value: V): this;
            delete(value: V): boolean;
            [Symbol.iterator](): IterableIterator<[V]>;
          }

          const storageLike: Storage<string> | SetStorage<string> =
            storage as Storage<string> | SetStorage<string>;

          storageLike['has']('foo');
          storageLike['add']('foo');
          storageLike['delete']('foo');
          storageLike[Symbol.iterator]();
        }
      }
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

  test('add, delete, has - computed numbers', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { SetStorage, SmartContract } from '@neo-one/smart-contract';

      export class StorageContract extends SmartContract {
        ${properties}

        private readonly storage = SetStorage.for<number>();

        public run(): void {
          const storage = this.storage;
          storage.has(1);
          assertEqual(storage.has(1), false);

          assertEqual(storage.delete(1), false);
          storage.delete(1);
          storage.add(0).add(1).add(16);
          assertEqual(storage.has(1 - 1), true);
          assertEqual(storage.has(2 - 1), true);
          assertEqual(storage.has(17 - 1), true);

          storage.delete(0);
          assertEqual(storage.delete(1), true);
          assertEqual(storage.delete(1), false);
          assertEqual(storage.delete(16), true);
          assertEqual(storage.has(0), false);
          assertEqual(storage.has(1), false);
          assertEqual(storage.has(16), false);

          storage.add(1 - 1).add(2 - 1).add(17 - 1);
          assertEqual(storage.has(0), true);
          assertEqual(storage.has(1), true);
          assertEqual(storage.has(16), true);
          storage.delete(1 - 1);
          storage.delete(2 - 1);
          storage.delete(17 -1);
          assertEqual(storage.has(1 - 1), false);
          assertEqual(storage.has(2 - 1), false);
          assertEqual(storage.has(17 - 1), false);

          interface Storage<V> {
            has(value: V): boolean;
            add(value: V): this;
            delete(value: V): boolean;
            [Symbol.iterator](): IterableIterator<[V]>;
          }

          const storageLike: Storage<number> | SetStorage<number> =
            storage as Storage<number> | SetStorage<number>;

          storageLike['has'](0);
          storageLike['add'](0);
          storageLike['delete'](0);
          storageLike[Symbol.iterator]();
        }
      }
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

  test('multi-tier - level 0', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { SetStorage, SmartContract, Address, Hash256 } from '@neo-one/smart-contract';

      const addressA = Address.from('${keys[0].address}');
      const addressB = Address.from('${keys[1].address}');
      const hashA = Hash256.from('${hashes.OLD_NEO_ASSET_HASH}');
      const hashB = Hash256.from('${hashes.OLD_GAS_ASSET_HASH}');
      const keyA = 'keyA';
      const keyB = 'keyB';
      const keyC = 'keyC';
      type Storage = SetStorage<[Address, Hash256, string]>;

      const testAtAddHasDelete = (storage: Storage) => {
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
      };

      const testAtAddHasDelete1 = (storage: Storage) => {
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
      }

      const testLevel0 = (storage: Storage) => {
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
      }

      export class StorageContract extends SmartContract {
        ${properties}

        private readonly storage = SetStorage.for<[Address, Hash256, string]>();

        public run(): void {
          testAtAddHasDelete(this.storage);
          testAtAddHasDelete1(this.storage);

          this.storage.add([addressA, hashA, keyA]);
          this.storage.add([addressA, hashB, keyB]);
          this.storage.add([addressB, hashB, keyB]);
          this.storage.add([addressB, hashB, keyB]);
          this.storage.add([addressB, hashB, keyC]);
          this.storage.add([addressB, hashB, keyC]);
          testLevel0(this.storage);
        }
      }
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

  test('multi-tier - level 1', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { SetStorage, SmartContract, Address, Hash256 } from '@neo-one/smart-contract';

      const addressA = Address.from('${keys[0].address}');
      const addressB = Address.from('${keys[1].address}');
      const hashA = Hash256.from('${hashes.OLD_NEO_ASSET_HASH}');
      const hashB = Hash256.from('${hashes.OLD_GAS_ASSET_HASH}');
      const keyA = 'keyA';
      const keyB = 'keyB';
      const keyC = 'keyC';
      type Storage = SetStorage<[Address, Hash256, string]>;

      const testLevel1 = (storage: Storage) => {
        let count = 0;
        let hashes = Buffer.from('', 'hex');
        let keys = '';
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
      }

      export class StorageContract extends SmartContract {
        ${properties}

        private readonly storage = SetStorage.for<[Address, Hash256, string]>();

        public run(): void {
          this.storage.add([addressA, hashA, keyA]);
          this.storage.add([addressA, hashB, keyB]);
          this.storage.add([addressB, hashB, keyB]);
          this.storage.add([addressB, hashB, keyB]);
          this.storage.add([addressB, hashB, keyC]);
          this.storage.add([addressB, hashB, keyC]);

          testLevel1(this.storage);
        }
      }
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

  test('multi-tier - level 3', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { SetStorage, SmartContract, Address, Hash256 } from '@neo-one/smart-contract';

      const addressA = Address.from('${keys[0].address}');
      const addressB = Address.from('${keys[1].address}');
      const hashA = Hash256.from('${hashes.OLD_NEO_ASSET_HASH}');
      const hashB = Hash256.from('${hashes.OLD_GAS_ASSET_HASH}');
      const keyA = 'keyA';
      const keyB = 'keyB';
      const keyC = 'keyC';
      type Storage = SetStorage<[Address, Hash256, string]>;

      const testLevel2 = (storage: Storage) => {
        let count = 0;
        let keys = '';
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
      }

      export class StorageContract extends SmartContract {
        ${properties}

        private readonly storage = SetStorage.for<[Address, Hash256, string]>();

        public run(): void {
          this.storage.add([addressA, hashA, keyA]);
          this.storage.add([addressA, hashB, keyB]);
          this.storage.add([addressB, hashB, keyB]);
          this.storage.add([addressB, hashB, keyB]);
          this.storage.add([addressB, hashB, keyC]);
          this.storage.add([addressB, hashB, keyC]);

          testLevel2(this.storage);
        }
      }
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

  test('invalid create', async () => {
    await helpers.compileString(
      `
      import { SetStorage } from '@neo-one/smart-contract';

      const storage = SetStorage.for<number>();
    `,
      { type: 'error', code: DiagnosticCode.InvalidStructuredStorageFor },
    );
  });

  test('invalid reference', async () => {
    await helpers.compileString(
      `
      import { SetStorage } from '@neo-one/smart-contract';

      const for = SetStorage.for;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid "reference"', async () => {
    await helpers.compileString(
      `
      import { SetStorage } from '@neo-one/smart-contract';

      const for = SetStorage['for'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid reference - object', async () => {
    await helpers.compileString(
      `
      import { SetStorage } from '@neo-one/smart-contract';

      const { for } = SetStorage;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
