import { helpers, keys } from '../../../__data__';

const properties = `
public readonly properties = {
  codeVersion: '1.0',
  author: 'dicarlo2',
  email: 'alex.dicarlo@neotracker.io',
  description: 'The TestSmartContract',
};
`;

describe('ArrayLiteralExpressionCompiler', () => {
  test('[1, foo(), y]', async () => {
    await helpers.executeString(`
      let i = 1;
      const foo = () => i++;
      const y = 3;
      [foo()];
      const x = [1, foo(), 3];

      if (x[0] !== 1) {
        throw 'Failure';
      }

      if (x[1] !== 2) {
        throw 'Failure';
      }

      if (x[2] !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('[1, 2, 3].map((x) => x + 1)', async () => {
    await helpers.executeString(`
      const y = [1, 2, 3];
      const x = y.map((value) => value + 1);

      if (x[0] !== 2) {
        throw 'Failure';
      }

      if (x[1] !== 3) {
        throw 'Failure';
      }

      if (x[2] !== 4) {
        throw 'Failure';
      }
    `);
  });

  test('[1, 2, 3, 4].filter((x) => x % 2 === 0)', async () => {
    await helpers.executeString(`
      const y = [1, 2, 3, 4];
      const x = y.filter((value) => value % 2 === 0);

      if (x[0] !== 2) {
        throw 'Failure';
      }

      if (x[1] !== 4) {
        throw 'Failure';
      }
    `);
  });

  test('[1, 2, 3, 4].reduce((x, y) => x + y, 10)', async () => {
    await helpers.executeString(`
      const y = [1, 2, 3, 4];
      const x = y.reduce((a, b) => a + b, 10);

      if (x !== 20) {
        throw 'Failure';
      }
    `);
  });

  test('array spread', async () => {
    await helpers.executeString(`
      const y = [0, 1, 2];
      const x = [-1, ...y, 3];

      assertEqual(x[0], -1);
      assertEqual(x[1], 0);
      assertEqual(x[2], 1);
      assertEqual(x[3], 2);
      assertEqual(x[4], 3);
    `);
  });

  test('map spread', async () => {
    await helpers.executeString(`
      const y = new Map<string, number>();
      y.set('b', 0);
      y.set('c', 1);
      y.set('d', 2);
      const x: ReadonlyArray<[string, number]> = [['a', -1], ...y, ['e', 3]];

      assertEqual(x[0][0], 'a');
      assertEqual(x[1][0], 'b');
      assertEqual(x[2][0], 'c');
      assertEqual(x[3][0], 'd');
      assertEqual(x[4][0], 'e');
      assertEqual(x[0][1], -1);
      assertEqual(x[1][1], 0);
      assertEqual(x[2][1], 1);
      assertEqual(x[3][1], 2);
      assertEqual(x[4][1], 3);
    `);
  });

  test('set spread', async () => {
    await helpers.executeString(`
      const y = new Set<number>();
      y.add(0);
      y.add(1);
      y.add(2);
      const x = [-1, ...y, 3];

      assertEqual(x[0], -1);
      assertEqual(x[1], 0);
      assertEqual(x[2], 1);
      assertEqual(x[3], 2);
      assertEqual(x[4], 3);
    `);
  });

  test('array storage spread', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract, ArrayStorage } from '@neo-one/smart-contract';

      export class Storage implements SmartContract {
        ${properties}
        public readonly owner: Address = Address.from('${keys[0].address}')
        private readonly storage = ArrayStorage.for<number>();

        public run(): boolean {
          this.storage.push(0);
          this.storage.push(1);
          this.storage.push(2);
          const x = [-1, ...this.storage, 3];

          assertEqual(x[0], -1);
          assertEqual(x[1], 0);
          assertEqual(x[2], 1);
          assertEqual(x[3], 2);
          assertEqual(x[4], 3);

          return true;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        run(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.run(), true);
    `);
  });

  test('map storage', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract, MapStorage } from '@neo-one/smart-contract';

      export class Storage implements SmartContract {
        ${properties}
        public readonly owner: Address = Address.from('${keys[0].address}')
        private readonly storage = MapStorage.for<string, number>();

        public run(): boolean {
          this.storage.set('b', 0);
          this.storage.set('c', 1);
          this.storage.set('d', 2);
          const x: ReadonlyArray<[string, number]> = [['a', -1], ...this.storage, ['e', 3]];

          assertEqual(x[0][0], 'a');
          assertEqual(x[1][0], 'b');
          assertEqual(x[2][0], 'c');
          assertEqual(x[3][0], 'd');
          assertEqual(x[4][0], 'e');
          assertEqual(x[0][1], -1);
          assertEqual(x[1][1], 0);
          assertEqual(x[2][1], 1);
          assertEqual(x[3][1], 2);
          assertEqual(x[4][1], 3);

          return true;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        run(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.run(), true);
    `);
  });

  test('set storage spread', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract, SetStorage } from '@neo-one/smart-contract';

      export class Storage implements SmartContract {
        ${properties}
        public readonly owner: Address = Address.from('${keys[0].address}')
        private readonly storage = SetStorage.for<number>();

        public run(): boolean {
          this.storage.add(0);
          this.storage.add(1);
          this.storage.add(2);
          const x = [-1, ...this.storage, 3];

          assertEqual(x[0], -1);
          assertEqual(x[1], 0);
          assertEqual(x[2], 1);
          assertEqual(x[3], 2);
          assertEqual(x[4], 3);

          return true;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        run(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.run(), true);
    `);
  });

  test('iterable iterator spread', async () => {
    await helpers.executeString(`
      const y = [0, 1, 2];
      const x = [-1, ...y[Symbol.iterator](), 3];

      assertEqual(x[0], -1);
      assertEqual(x[1], 0);
      assertEqual(x[2], 1);
      assertEqual(x[3], 2);
      assertEqual(x[4], 3);
    `);
  });
});
