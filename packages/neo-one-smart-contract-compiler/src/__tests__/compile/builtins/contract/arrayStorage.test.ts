import { helpers } from '../../../../__data__';
import { ArrayStorageIterator } from '../../../../compile/builtins/contract/arrayStorage/iterator';
import { ArrayStoragePop } from '../../../../compile/builtins/contract/arrayStorage/pop';
import { ArrayStoragePush } from '../../../../compile/builtins/contract/arrayStorage/push';
import { DiagnosticCode } from '../../../../DiagnosticCode';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('ArrayStorage', () => {
  test('length, push, pop, index', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { ArrayStorage, SmartContract } from '@neo-one/smart-contract';

      const test = (storage: ArrayStorage<string>) => {
        assertEqual(storage instanceof ArrayStorage, true);
        assertEqual(storage.length, 0);
        assertEqual(storage.length, 1 - 1);

        storage[0] = '10';
        assertEqual(storage[0], '10');
        assertEqual(storage[1] as string | undefined, undefined);
        assertEqual(storage.length, 1);

        const result = storage.push('11', '12', '13');
        assertEqual(result, 4);
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

        interface Storage<T> {
          readonly [Symbol.iterator]: () => IterableIterator<T>;
          readonly length: number;
          readonly push: (...items: T[]) => number;
          readonly pop: () => T | undefined;
          [n: number]: T;
        }

        const storageLike: Storage<string> | ArrayStorage<string> =
          storage as Storage<string> | ArrayStorage<string>;

        storageLike['push']('foo');
        assertEqual(storageLike[0], 'foo');
        assertEqual(storageLike['length'], 1);
        storageLike['pop']();
        assertEqual(storageLike[0] as string | undefined, undefined);
        assertEqual(storageLike['length'], 0);
        storageLike[Symbol.iterator]();
      }

      export class StorageContract extends SmartContract {
        ${properties}

        private readonly storage = ArrayStorage.for<string>();

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

  test('get index by hardcoded and computed values', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { ArrayStorage, SmartContract } from '@neo-one/smart-contract';

      const test = (storage: ArrayStorage<string>) => {
        storage[0] = '10';
        assertEqual(storage[0], '10');
        assertEqual(storage[1 - 1], '10');
        assertEqual(storage[0 + 0], '10');
        assertEqual(storage[9 * 0], '10');
        assertEqual(storage[0 / 9], '10');
        storage[1] = '100';
        assertEqual(storage[1], '100');
        assertEqual(storage[2 - 1], '100');
        assertEqual(storage[0 + 1], '100');
        assertEqual(storage[1 / 1], '100');
        assertEqual(storage[1 * 1], '100');
        storage[18] = '18';
        assertEqual(storage[18], '18');
        assertEqual(storage[36 - 18], '18');
        assertEqual(storage[13 + 5], '18');
        assertEqual(storage[36 / 2], '18');
        assertEqual(storage[3 * 6], '18');
      }

      export class StorageContract extends SmartContract {
        ${properties}
        private readonly storage = ArrayStorage.for<string>();

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

  test('set index by subtracted values', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { ArrayStorage, SmartContract } from '@neo-one/smart-contract';

      const test = (storage: ArrayStorage<string>) => {
        storage[1 - 1] = '10';
        assertEqual(storage[0], '10');
        assertEqual(storage[2 - 2], '10');
        assertEqual(storage[0 + 0], '10');
        assertEqual(storage[9 * 0], '10');
        assertEqual(storage[0 / 9], '10');
        storage[2 - 1] = '100';
        assertEqual(storage[1], '100');
        assertEqual(storage[2 - 1], '100');
        assertEqual(storage[0 + 1], '100');
        assertEqual(storage[1 / 1], '100');
        assertEqual(storage[1 * 1], '100');
        storage[19 - 1] = '18';
        assertEqual(storage[18], '18');
        assertEqual(storage[36 - 18], '18');
        assertEqual(storage[13 + 5], '18');
        assertEqual(storage[36 / 2], '18');
        assertEqual(storage[3 * 6], '18');
      }

      export class StorageContract extends SmartContract {
        ${properties}
        private readonly storage = ArrayStorage.for<string>();

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

  test('set index by added values', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { ArrayStorage, SmartContract } from '@neo-one/smart-contract';

      const test = (storage: ArrayStorage<string>) => {
        storage[0 + 0] = '10';
        assertEqual(storage[0], '10');
        assertEqual(storage[2 - 2], '10');
        assertEqual(storage[0 + 0], '10');
        assertEqual(storage[9 * 0], '10');
        assertEqual(storage[0 / 9], '10');
        storage[1 + 0] = '100';
        assertEqual(storage[1], '100');
        assertEqual(storage[2 - 1], '100');
        assertEqual(storage[0 + 1], '100');
        assertEqual(storage[1 / 1], '100');
        assertEqual(storage[1 * 1], '100');
        storage[17 + 1] = '18';
        assertEqual(storage[18], '18');
        assertEqual(storage[36 - 18], '18');
        assertEqual(storage[13 + 5], '18');
        assertEqual(storage[36 / 2], '18');
        assertEqual(storage[3 * 6], '18');
      }

      export class StorageContract extends SmartContract {
        ${properties}
        private readonly storage = ArrayStorage.for<string>();

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

  test('set index by multiplied values', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { ArrayStorage, SmartContract } from '@neo-one/smart-contract';

      const test = (storage: ArrayStorage<string>) => {
        storage[0 * 9] = '10';
        assertEqual(storage[0], '10');
        assertEqual(storage[2 - 2], '10');
        assertEqual(storage[0 + 0], '10');
        assertEqual(storage[9 * 0], '10');
        assertEqual(storage[0 / 9], '10');
        storage[1 * 1] = '100';
        assertEqual(storage[1], '100');
        assertEqual(storage[2 - 1], '100');
        assertEqual(storage[0 + 1], '100');
        assertEqual(storage[1 / 1], '100');
        assertEqual(storage[1 * 1], '100');
        storage[6 * 3] = '18';
        assertEqual(storage[18], '18');
        assertEqual(storage[36 - 18], '18');
        assertEqual(storage[13 + 5], '18');
        assertEqual(storage[36 / 2], '18');
        assertEqual(storage[3 * 6], '18');
      }

      export class StorageContract extends SmartContract {
        ${properties}
        private readonly storage = ArrayStorage.for<string>();

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

  test('set index by divided values', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { ArrayStorage, SmartContract } from '@neo-one/smart-contract';

      const test = (storage: ArrayStorage<string>) => {
        storage[0 / 9] = '10';
        assertEqual(storage[0], '10');
        assertEqual(storage[2 - 2], '10');
        assertEqual(storage[0 + 0], '10');
        assertEqual(storage[9 * 0], '10');
        assertEqual(storage[0 / 9], '10');
        storage[1 / 1] = '100';
        assertEqual(storage[1], '100');
        assertEqual(storage[2 - 1], '100');
        assertEqual(storage[0 + 1], '100');
        assertEqual(storage[1 / 1], '100');
        assertEqual(storage[1 * 1], '100');
        storage[36 / 2] = '18';
        assertEqual(storage[18], '18');
        assertEqual(storage[36 - 18], '18');
        assertEqual(storage[13 + 5], '18');
        assertEqual(storage[36 / 2], '18');
        assertEqual(storage[3 * 6], '18');
      }

      export class StorageContract extends SmartContract {
        ${properties}
        private readonly storage = ArrayStorage.for<string>();

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

  test('iteration', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { ArrayStorage, SmartContract } from '@neo-one/smart-contract';

      export class StorageContract extends SmartContract {
        ${properties}
        private readonly prefix = ArrayStorage.for<string>();

        public setupStorage(): void {
          const storage = this.prefix;
          const keyA = 'keyA';
          const keyB = 'keyB';
          const keyC = 'keyC';
          const keyD = 'keyD';

          storage.push(keyA);
          storage.push(keyB);
          storage.push(keyC);
          storage.push(keyD);
        }

        public run(): void {
          const storage = this.prefix;
          const keyA = 'keyA';
          const keyB = 'keyB';
          const keyC = 'keyC';
          const keyD = 'keyD';
          assertEqual(storage.length, 4);

          let count = 0;
          let indices = 0;
          let keys = '';
          storage.forEach((key, idx) => {
            count += 1;
            indices += idx;
            keys += key;
          });
          storage.forEach((key, idx) => {
            assertEqual(idx, idx + 0)
            if (idx === 0) {
              assertEqual(idx, 1 - 1);
            }
            if (idx === 1) {
              assertEqual(idx, 2 - 1);
            }
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

          interface StorageLike<T> {
            [Symbol.iterator](): IterableIterator<T>;
          }

          const storageLike: StorageLike<string> | ArrayStorage<string> = storage as StorageLike<string> | ArrayStorage<string>;

          storageLike[Symbol.iterator]();
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
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): void;
        setupStorage(): void;
        run(): void;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));
      contract.deploy();
      contract.setupStorage();
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        setupStorage(): void;
        run(): void;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));
      contract.run();
    `);
  });

  test('canCall', () => {
    expect(new ArrayStorageIterator().canCall()).toEqual(true);
    expect(new ArrayStoragePush().canCall()).toEqual(true);
    expect(new ArrayStoragePop().canCall()).toEqual(true);
  });

  test('invalid create', async () => {
    await helpers.compileString(
      `
      import { ArrayStorage } from '@neo-one/smart-contract';

      const storage = ArrayStorage.for<number>();
    `,
      { type: 'error', code: DiagnosticCode.InvalidStructuredStorageFor },
    );
  });

  test('invalid create - class', async () => {
    await helpers.compileString(
      `
      import { ArrayStorage } from '@neo-one/smart-contract';

      export class Foo {
        private readonly storage = ArrayStorage.for<number>();
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidStructuredStorageFor },
    );
  });

  test('invalid reference', async () => {
    await helpers.compileString(
      `
      import { ArrayStorage } from '@neo-one/smart-contract';

      const for = ArrayStorage.for;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid "reference"', async () => {
    await helpers.compileString(
      `
      import { ArrayStorage } from '@neo-one/smart-contract';

      const for = ArrayStorage['for'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid reference - object', async () => {
    await helpers.compileString(
      `
      import { ArrayStorage } from '@neo-one/smart-contract';

      const { for } = ArrayStorage;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
