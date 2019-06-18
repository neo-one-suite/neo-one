import { common } from '@neo-one/client-common';
import { helpers, keys } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('MapStorage', () => {
  test('get, set, delete, has', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { MapStorage, SmartContract } from '@neo-one/smart-contract';

      const test = (storage: MapStorage<string, number>) => {
        storage.get('foo');
        assertEqual(storage.get('foo'), undefined);
        assertEqual(storage.has('foo'), false);
        assertEqual(storage instanceof MapStorage, true);

        assertEqual(storage.delete('foo'), false);
        storage.delete('foo');
        storage.set('foo', 10).set('bar', 5);
        assertEqual(storage.get('foo'), 10);
        assertEqual(storage.get('bar'), 5);
        assertEqual(storage.has('foo'), true);
        assertEqual(storage.has('bar'), true);

        storage.delete('bar');
        assertEqual(storage.delete('foo'), true);
        assertEqual(storage.delete('foo'), false);
        assertEqual(storage.get('foo'), undefined);
        assertEqual(storage.has('foo'), false);

        interface Storage<K, V> {
          get(key: K): V | undefined;
          has(key: K): boolean;
          set(key: K, value: V): this;
          delete(key: K): boolean;
          [Symbol.iterator](): IterableIterator<[K, V]>;
        }

        const storageLike: Storage<string, number> | MapStorage<string, number> =
          storage as Storage<string, number> | MapStorage<string, number>;

        storageLike['get']('foo');
        storageLike['has']('foo');
        storageLike['set']('foo', 9);
        storageLike['delete']('foo');
        storageLike[Symbol.iterator]();
      }

      export class StorageContract extends SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'StorageContract',
        };
        private readonly storage = MapStorage.for<string, number>();

        public run(): void {
          test(this.storage);
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

  test('multi-tier', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { MapStorage, SmartContract, Address, Hash256 } from '@neo-one/smart-contract';

      const addressA = Address.from('${keys[0].address}');
      const hashA = Hash256.from('${common.NEO_ASSET_HASH}');
      const keyA = 'keyA';
      const valueA = 1;
      const valueB = 2;
      const valueC = 3;

      type Storage = MapStorage<[Address, Hash256, string], number>;

      const testAtGetSetHasDelete = (storage: Storage) => {
        storage.set([addressA, hashA, keyA], valueA);
        assertEqual(storage.get([addressA, hashA, keyA]), valueA);
        assertEqual(storage.at([addressA, hashA]).get(keyA), valueA);
        assertEqual(storage.at(addressA).get([hashA, keyA]), valueA);
        assertEqual(storage.at(addressA).at(hashA).get(keyA), valueA);
        assertEqual(storage.has([addressA, hashA, keyA]), true);
        assertEqual(storage.at([addressA, hashA]).has(keyA), true);
        assertEqual(storage.at(addressA).has([hashA, keyA]), true);
        assertEqual(storage.at(addressA).at(hashA).has(keyA), true);
        storage.at(addressA).set([hashA, keyA], valueB)
        assertEqual(storage.get([addressA, hashA, keyA]), valueB);
        assertEqual(storage.at([addressA, hashA]).get(keyA), valueB);
        assertEqual(storage.at(addressA).get([hashA, keyA]), valueB);
        assertEqual(storage.at(addressA).at(hashA).get(keyA), valueB);
        assertEqual(storage.has([addressA, hashA, keyA]), true);
        assertEqual(storage.at([addressA, hashA]).has(keyA), true);
        assertEqual(storage.at(addressA).has([hashA, keyA]), true);
        assertEqual(storage.at(addressA).at(hashA).has(keyA), true);
        storage.at([addressA, hashA]).set(keyA, valueC)
        assertEqual(storage.get([addressA, hashA, keyA]), valueC);
        assertEqual(storage.at([addressA, hashA]).get(keyA), valueC);
        assertEqual(storage.at(addressA).get([hashA, keyA]), valueC);
        assertEqual(storage.at(addressA).at(hashA).get(keyA), valueC);
        assertEqual(storage.has([addressA, hashA, keyA]), true);
        assertEqual(storage.at([addressA, hashA]).has(keyA), true);
        assertEqual(storage.at(addressA).has([hashA, keyA]), true);
        assertEqual(storage.at(addressA).at(hashA).has(keyA), true);
      };

      const testAtGetSetHasDelete1 = (storage: Storage) => {
        storage.set([addressA, hashA, keyA], valueA);
        assertEqual(storage.has([addressA, hashA, keyA]), true);
        assertEqual(storage.at([addressA, hashA]).has(keyA), true);
        assertEqual(storage.at(addressA).has([hashA, keyA]), true);
        assertEqual(storage.at(addressA).at(hashA).has(keyA), true);
        storage.delete([addressA, hashA, keyA]);
        assertEqual(storage.has([addressA, hashA, keyA]), false);
        assertEqual(storage.at([addressA, hashA]).has(keyA), false);
        assertEqual(storage.at(addressA).has([hashA, keyA]), false);
        assertEqual(storage.at(addressA).at(hashA).has(keyA), false);
        storage.at(addressA).set([hashA, keyA], valueB)
        assertEqual(storage.has([addressA, hashA, keyA]), true);
        assertEqual(storage.at([addressA, hashA]).has(keyA), true);
        assertEqual(storage.at(addressA).has([hashA, keyA]), true);
        assertEqual(storage.at(addressA).at(hashA).has(keyA), true);
        storage.at(addressA).delete([hashA, keyA])
        assertEqual(storage.has([addressA, hashA, keyA]), false);
        assertEqual(storage.at([addressA, hashA]).has(keyA), false);
        assertEqual(storage.at(addressA).has([hashA, keyA]), false);
        assertEqual(storage.at(addressA).at(hashA).has(keyA), false);
        storage.at([addressA, hashA]).set(keyA, valueC)
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

      export class StorageContract extends SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'StorageContract',
        };
        private readonly storage = MapStorage.for<[Address, Hash256, string], number>();

        public run(): void {
          testAtGetSetHasDelete(this.storage);
          testAtGetSetHasDelete1(this.storage);
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
      import { MapStorage, SmartContract, Address, Hash256 } from '@neo-one/smart-contract';

      const addressA = Address.from('${keys[0].address}');
      const addressB = Address.from('${keys[1].address}');
      const hashA = Hash256.from('${common.NEO_ASSET_HASH}');
      const hashB = Hash256.from('${common.GAS_ASSET_HASH}');
      const keyA = 'keyA';
      const keyB = 'keyB';
      const keyC = 'keyC';
      const valueA = 1;
      const valueB = 2;
      const valueC = 3;
      const valueD = 4;

      type Storage = MapStorage<[Address, Hash256, string], number>;

      const testLevel0 = (storage: Storage) => {
        storage.set([addressA, hashA, keyA], valueA);
        storage.set([addressA, hashB, keyB], valueB);
        storage.set([addressB, hashB, keyB], valueC);
        storage.set([addressB, hashB, keyC], valueD);

        let count = 0;
        let result = 0;
        let addresses = Buffer.from('', 'hex');
        let hashes = Buffer.from('', 'hex');
        let keys = '';
        storage.forEach((value, key) => {
          count += 1;
          result += value;
          addresses = Buffer.concat([addresses, key[0]]);
          hashes = Buffer.concat([hashes, key[1]]);
          keys += key[2];
        });
        assertEqual(count, 4);
        assertEqual(result, valueA + valueB + valueC + valueD);
        assertEqual(addresses.equals(Buffer.concat([addressA, addressA, addressB, addressB])), true);
        assertEqual(hashes.equals(Buffer.concat([hashA, hashB, hashB, hashB])), true);
        assertEqual(keys, keyA + keyB + keyB + keyC);

        count = 0;
        result = 0;
        addresses = Buffer.from('', 'hex');
        hashes = Buffer.from('', 'hex');
        keys = '';
        for (const [key, value] of storage) {
          count += 1;
          result += value;
          addresses = Buffer.concat([addresses, key[0]]);
          hashes = Buffer.concat([hashes, key[1]]);
          keys += key[2];
        }
        assertEqual(count, 4);
        assertEqual(result, valueA + valueB + valueC + valueD);
        assertEqual(addresses.equals(Buffer.concat([addressA, addressA, addressB, addressB])), true);
        assertEqual(hashes.equals(Buffer.concat([hashA, hashB, hashB, hashB])), true);
        assertEqual(keys, keyA + keyB + keyB + keyC);

        storage[Symbol.iterator]();
        const firstIterator = storage[Symbol.iterator]();

        let firstResult = firstIterator.next();
        assertEqual(firstResult.value[0][0].equals(addressA), true);
        assertEqual(firstResult.value[0][1].equals(hashA), true);
        assertEqual(firstResult.value[0][2], keyA);
        assertEqual(firstResult.value[1], valueA);
        assertEqual(firstResult.done, false);
        firstResult = firstIterator.next();
        assertEqual(firstResult.value[0][0].equals(addressA), true);
        assertEqual(firstResult.value[0][1].equals(hashB), true);
        assertEqual(firstResult.value[0][2], keyB);
        assertEqual(firstResult.value[1], valueB);
        assertEqual(firstResult.done, false);
        firstResult = firstIterator.next();
        assertEqual(firstResult.value[0][0].equals(addressB), true);
        assertEqual(firstResult.value[0][1].equals(hashB), true);
        assertEqual(firstResult.value[0][2], keyB);
        assertEqual(firstResult.value[1], valueC);
        assertEqual(firstResult.done, false);
        firstResult = firstIterator.next();
        assertEqual(firstResult.value[0][0].equals(addressB), true);
        assertEqual(firstResult.value[0][1].equals(hashB), true);
        assertEqual(firstResult.value[0][2], keyC);
        assertEqual(firstResult.value[1], valueD);
        assertEqual(firstResult.done, false);
        firstResult = firstIterator.next();
        assertEqual(firstResult.value as [[Address, Hash256, string], number] | undefined, undefined);
        assertEqual(firstResult.done, true);
      }

      export class StorageContract extends SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'StorageContract',
        };
        private readonly storage = MapStorage.for<[Address, Hash256, string], number>();

        public run(): void {
          this.storage.set([addressA, hashA, keyA], valueA);
          this.storage.set([addressA, hashB, keyB], valueB);
          this.storage.set([addressB, hashB, keyB], valueC);
          this.storage.set([addressB, hashB, keyC], valueD);
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
      import { MapStorage, SmartContract, Address, Hash256 } from '@neo-one/smart-contract';

      const addressA = Address.from('${keys[0].address}');
      const addressB = Address.from('${keys[1].address}');
      const hashA = Hash256.from('${common.NEO_ASSET_HASH}');
      const hashB = Hash256.from('${common.GAS_ASSET_HASH}');
      const keyA = 'keyA';
      const keyB = 'keyB';
      const keyC = 'keyC';
      const valueA = 1;
      const valueB = 2;
      const valueC = 3;
      const valueD = 4;

      type Storage = MapStorage<[Address, Hash256, string], number>;

      const testLevel1 = (storage: Storage) => {
        let count = 0;
        let result = 0;
        let hashes = Buffer.from('', 'hex');
        let keys = '';
        storage.at(addressA).forEach((value, key) => {
          count += 1;
          result += value;
          hashes = Buffer.concat([hashes, key[0]]);
          keys += key[1];
        });
        assertEqual(count, 2);
        assertEqual(result, valueA + valueB);
        assertEqual(hashes.equals(Buffer.concat([hashA, hashB])), true);
        assertEqual(keys, keyA + keyB);

        const secondIterator = storage.at(addressA)[Symbol.iterator]();

        let secondResult = secondIterator.next();
        assertEqual(secondResult.value[0][0].equals(hashA), true);
        assertEqual(secondResult.value[0][1], keyA);
        assertEqual(secondResult.value[1], valueA);
        assertEqual(secondResult.done, false);
        secondResult = secondIterator.next();
        assertEqual(secondResult.value[0][0].equals(hashB), true);
        assertEqual(secondResult.value[0][1], keyB);
        assertEqual(secondResult.value[1], valueB);
        assertEqual(secondResult.done, false);
        secondResult = secondIterator.next();
        assertEqual(secondResult.value as [[Hash256, string], number] | undefined, undefined);
        assertEqual(secondResult.done, true);

        count = 0;
        result = 0;
        hashes = Buffer.from('', 'hex');
        keys = '';
        for (const [key, value] of storage.at(addressA)) {
          count += 1;
          result += value;
          hashes = Buffer.concat([hashes, key[0]]);
          keys += key[1];
        }
        assertEqual(count, 2);
        assertEqual(result, valueA + valueB);
        assertEqual(hashes.equals(Buffer.concat([hashA, hashB])), true);
        assertEqual(keys, keyA + keyB);

        count = 0;
        result = 0;
        hashes = Buffer.from('', 'hex');
        keys = '';
        storage.at(addressB).forEach((value, key) => {
          count += 1;
          result += value;
          hashes = Buffer.concat([hashes, key[0]]);
          keys += key[1];
        });
        assertEqual(count, 2);
        assertEqual(result, valueC + valueD);
        assertEqual(hashes.equals(Buffer.concat([hashB, hashB])), true);
        assertEqual(keys, keyB + keyC);

        const thirdIterator = storage.at(addressB)[Symbol.iterator]();
        let thirdResult = thirdIterator.next();
        assertEqual(thirdResult.value[0][0].equals(hashB), true);
        assertEqual(thirdResult.value[0][1], keyB);
        assertEqual(thirdResult.value[1], valueC);
        assertEqual(thirdResult.done, false);
        thirdResult = thirdIterator.next();
        assertEqual(thirdResult.value[0][0].equals(hashB), true);
        assertEqual(thirdResult.value[0][1], keyC);
        assertEqual(thirdResult.value[1], valueD);
        assertEqual(thirdResult.done, false);
        thirdResult = thirdIterator.next();
        assertEqual(thirdResult.value as [[Hash256, string], number] | undefined, undefined);
        assertEqual(thirdResult.done, true);

        count = 0;
        result = 0;
        hashes = Buffer.from('', 'hex');
        keys = '';
        for (const [key, value] of storage.at(addressB)) {
          count += 1;
          result += value;
          hashes = Buffer.concat([hashes, key[0]]);
          keys += key[1];
        }
        assertEqual(count, 2);
        assertEqual(result, valueC + valueD);
        assertEqual(hashes.equals(Buffer.concat([hashB, hashB])), true);
        assertEqual(keys, keyB + keyC);
      }

      export class StorageContract extends SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'StorageContract',
        };
        private readonly storage = MapStorage.for<[Address, Hash256, string], number>();

        public run(): void {
          this.storage.set([addressA, hashA, keyA], valueA);
          this.storage.set([addressA, hashB, keyB], valueB);
          this.storage.set([addressB, hashB, keyB], valueC);
          this.storage.set([addressB, hashB, keyC], valueD);

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

  test('multi-tier - level 2', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { MapStorage, SmartContract, Address, Hash256 } from '@neo-one/smart-contract';

      const addressA = Address.from('${keys[0].address}');
      const addressB = Address.from('${keys[1].address}');
      const hashA = Hash256.from('${common.NEO_ASSET_HASH}');
      const hashB = Hash256.from('${common.GAS_ASSET_HASH}');
      const keyA = 'keyA';
      const keyB = 'keyB';
      const keyC = 'keyC';
      const valueA = 1;
      const valueB = 2;
      const valueC = 3;
      const valueD = 4;

      type Storage = MapStorage<[Address, Hash256, string], number>;

      const testLevel2 = (storage: Storage) => {
        let count = 0;
        let result = 0;
        let keys = '';
        storage.at([addressA, hashA]).forEach((value, key) => {
          count += 1;
          result += value;
          keys += key;
        });
        assertEqual(count, 1);
        assertEqual(result, valueA);
        assertEqual(keys, keyA);

        const fourthIterator = storage.at([addressA, hashA])[Symbol.iterator]();
        let fourthResult = fourthIterator.next();
        assertEqual(fourthResult.value[0], keyA);
        assertEqual(fourthResult.value[1], valueA);
        assertEqual(fourthResult.done, false);
        fourthResult = fourthIterator.next();
        assertEqual(fourthResult.value as [string, number] | undefined, undefined);
        assertEqual(fourthResult.done, true);

        count = 0;
        result = 0;
        keys = '';
        for (const [key, value] of storage.at([addressA, hashA])) {
          count += 1;
          result += value;
          keys += key;
        }
        assertEqual(count, 1);
        assertEqual(result, valueA);
        assertEqual(keys, keyA);

        count = 0;
        result = 0;
        keys = '';
        storage.at([addressA, hashB]).forEach((value, key) => {
          count += 1;
          result += value;
          keys += key;
        });
        assertEqual(count, 1);
        assertEqual(result, valueB);
        assertEqual(keys, keyB);

        const fifthIterator = storage.at([addressA, hashB])[Symbol.iterator]();
        let fifthResult = fifthIterator.next();
        assertEqual(fifthResult.value[0], keyB);
        assertEqual(fifthResult.value[1], valueB);
        assertEqual(fifthResult.done, false);
        fifthResult = fifthIterator.next();
        assertEqual(fifthResult.value as [string, number] | undefined, undefined);
        assertEqual(fifthResult.done, true);

        count = 0;
        result = 0;
        keys = '';
        for (const [key, value] of storage.at([addressA, hashB])) {
          count += 1;
          result += value;
          keys += key;
        }
        assertEqual(count, 1);
        assertEqual(result, valueB);
        assertEqual(keys, keyB);

        count = 0;
        result = 0;
        keys = '';
        storage.at([addressB, hashA]).forEach((value, key) => {
          count += 1;
          result += value;
          keys += key;
        });
        assertEqual(count, 0);
        assertEqual(result, 0);
        assertEqual(keys, '');

        const sixthIterator = storage.at([addressB, hashA])[Symbol.iterator]();
        let sixthResult = sixthIterator.next();
        assertEqual(sixthResult.value as [string, number] | undefined, undefined);
        assertEqual(sixthResult.done, true);

        count = 0;
        result = 0;
        keys = '';
        for (const [key, value] of storage.at([addressB, hashA])) {
          count += 1;
          result += value;
          keys += key;
        }
        assertEqual(count, 0);
        assertEqual(result, 0);
        assertEqual(keys, '');

        count = 0;
        result = 0;
        keys = '';
        storage.at([addressB, hashB]).forEach((value, key) => {
          count += 1;
          result += value;
          keys += key;
        });
        assertEqual(count, 2);
        assertEqual(result, valueC + valueD);
        assertEqual(keys, keyB + keyC);

        const seventhIterator = storage.at([addressB, hashB])[Symbol.iterator]();
        let seventhResult = seventhIterator.next();
        assertEqual(seventhResult.value[0], keyB);
        assertEqual(seventhResult.value[1], valueC);
        assertEqual(seventhResult.done, false);
        seventhResult = seventhIterator.next();
        assertEqual(seventhResult.value[0], keyC);
        assertEqual(seventhResult.value[1], valueD);
        assertEqual(seventhResult.done, false);
        seventhResult = seventhIterator.next();
        assertEqual(seventhResult.value as [string, number] | undefined, undefined);
        assertEqual(seventhResult.done, true);

        count = 0;
        result = 0;
        keys = '';
        for (const [key, value] of storage.at([addressB, hashB])) {
          count += 1;
          result += value;
          keys += key;
        }
        assertEqual(count, 2);
        assertEqual(result, valueC + valueD);
        assertEqual(keys, keyB + keyC);

        storage.delete([addressB, hashB, keyB]);
        count = 0;
        result = 0;
        keys = '';
        for (const [key, value] of storage.at([addressB, hashB])) {
          count += 1;
          result += value;
          keys += key;
        }
        assertEqual(count, 1);
        assertEqual(result, valueD);
        assertEqual(keys, keyC);
      }

      export class StorageContract extends SmartContract {
        public readonly properties = {
          codeVersion: '1.0',
          author: 'dicarlo2',
          email: 'alex.dicarlo@neotracker.io',
          description: 'StorageContract',
        };
        private readonly storage = MapStorage.for<[Address, Hash256, string], number>();

        public run(): void {
          this.storage.set([addressA, hashA, keyA], valueA);
          this.storage.set([addressA, hashB, keyB], valueB);
          this.storage.set([addressB, hashB, keyB], valueC);
          this.storage.set([addressB, hashB, keyC], valueD);

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

  test('object values', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { MapStorage, SmartContract } from '@neo-one/smart-contract';

      export class Contract extends SmartContract {
        private readonly storage = MapStorage.for<string, {
          readonly foo: string;
          readonly bar: number;
          readonly baz: boolean;
        }>();

        public run(): void {
          const storage = this.storage;
          const x = { foo: 'foo', bar: 0, baz: true };

          storage.set('hello', x);

          const result = storage.get('hello');

          if (result !== undefined) {
            assertEqual(result.foo, x.foo);
            assertEqual(result.bar, x.bar);
            assertEqual(result.baz, x.baz);
          } else {
            assertEqual(result === undefined, false);
          }
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

  test('invalid object value - method', () => {
    helpers.compileString(
      `
      import { SmartContract, MapStorage } from '@neo-one/smart-contract';

      export class Contract extends SmartContract {
        private readonly storage = MapStorage.for<string, {
          bar(): boolean;
        }>();

        public run(): void {
          this.storage.set('foo', {
            bar(): boolean {
              return true;
            },
          });
        }
      }
    `,
      { type: 'error' },
    );
  });

  test('invalid create', () => {
    helpers.compileString(
      `
      import { MapStorage } from '@neo-one/smart-contract';

      const storage = MapStorage.for<string, number>();
    `,
      { type: 'error', code: DiagnosticCode.InvalidStructuredStorageFor },
    );
  });

  test('invalid reference', () => {
    helpers.compileString(
      `
      import { MapStorage } from '@neo-one/smart-contract';

      const for = MapStorage.for;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid "reference"', () => {
    helpers.compileString(
      `
      import { MapStorage } from '@neo-one/smart-contract';

      const for = MapStorage['for'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid reference - object', () => {
    helpers.compileString(
      `
      import { MapStorage } from '@neo-one/smart-contract';

      const { for } = MapStorage;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
