import { helpers, keys } from '../../../../../__data__';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('SmartContract.for', () => {
  test('reports error on invalid argument values - Object', async () => {
    await helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        interface Baz {
          readonly x: string;
        }

        interface Foo {
          bar(value: Baz): number;
        }

        SmartContract.for<Foo>(Address.from('${keys[0].address}'));
      `,
      { type: 'error' },
    );
  });

  test('reports error on invalid argument values - optional Object', async () => {
    await helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        interface Baz {
          readonly x: string;
        }

        interface Foo {
          bar(value?: Baz): number;
        }

        SmartContract.for<Foo>(Address.from('${keys[0].address}'));
      `,
      { type: 'error' },
    );
  });

  test('reports error on invalid argument return - Object', async () => {
    await helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        interface Baz {
          readonly x: string;
        }

        interface Foo {
          bar(value: number): Baz;
        }

        SmartContract.for<Foo>(Address.from('${keys[0].address}'));
      `,
      { type: 'error' },
    );
  });

  test('reports error on invalid argument return - union string | number', async () => {
    await helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        interface Foo {
          bar(value: number): number | string;
        }

        const sc = SmartContract.for<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on multiple call signatures', async () => {
    await helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        interface Foo {
          bar(value: number): number | undefined;
          bar(value: string): string | undefined;
        }

        const sc = SmartContract.for<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on any parameter', async () => {
    await helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        interface Foo {
          bar(value: any): number | undefined;
        }

        const sc = SmartContract.for<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on any return', async () => {
    await helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        interface Foo {
          bar(value: number): any;
        }

        const sc = SmartContract.for<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on missing return', async () => {
    await helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        interface Foo {
          bar(value: number);
        }

        const sc = SmartContract.for<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on any smart contract type', async () => {
    await helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        const sc = SmartContract.for<any>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on any properties', async () => {
    await helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        interface Foo {
          bar: any;
        }

        const sc = SmartContract.for<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('dynamic call', async () => {
    const node = await helpers.startNode();
    const dynamicContract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class Dynamic extends SmartContract {
        ${properties}

        public run(value: number): string {
          assertEqual(value, 10);

          return 'dynamic';
        }
      }
    `);

    const callingContract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        run(value: number): string;
      }

      export class DynamicCall extends SmartContract {
        ${properties}

        public run(value: Address): string {
          const contract = SmartContract.for<Contract>(value);
          assertEqual(contract.run(10), 'dynamic');

          return 'dynamicCall';
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        run(value: Address): string;
      }
      SmartContract.for<Contract>(Address.from('${callingContract.address}'));
      const contract = SmartContract.for<Contract>(Address.from('${callingContract.address}'));
      assertEqual(contract.run(Address.from('${dynamicContract.address}')), 'dynamicCall');
    `);
  });
});
