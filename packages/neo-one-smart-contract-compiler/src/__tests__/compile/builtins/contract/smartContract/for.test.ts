import { helpers, keys } from '../../../../../__data__';

describe('SmartContract.for', () => {
  test('reports error on invalid argument values - Object', async () => {
    helpers.compileString(
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
    helpers.compileString(
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
    helpers.compileString(
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
    helpers.compileString(
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
    helpers.compileString(
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
    helpers.compileString(
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
    helpers.compileString(
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
    helpers.compileString(
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
    helpers.compileString(
      `
        import { Address, SmartContract } from '@neo-one/smart-contract';

        const sc = SmartContract.for<any>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on any properties', async () => {
    helpers.compileString(
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
      import { doReturn, getArgument } from '@neo-one/smart-contract-internal';

      assertEqual(getArgument<[number]>(1)[0], 10);
      doReturn(true);
    `);

    const callingContract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';
      import { getArgument } from '@neo-one/smart-contract-internal';

      interface Contract {
        run(value: number): boolean;
      }
      const contract = SmartContract.for<Contract>(getArgument<[Address]>(1)[0]);
      assertEqual(contract.run(10), true);
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        run(value: Address): void;
      }
      const contract = SmartContract.for<Contract>(Address.from('${callingContract.address}'));
      contract.run(Address.from('${dynamicContract.address}'));
    `);
  });
});
