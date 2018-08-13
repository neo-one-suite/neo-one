import { helpers, keys } from '../../../../../__data__';

describe('Address.getSmartContract', () => {
  test('reports error on invalid argument values - Object', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        interface Baz {
          readonly x: string;
        }

        interface Foo {
          bar(value: Baz): number;
        }

        Address.getSmartContract<Foo>(Address.from('${keys[0].address}'));
      `,
      { type: 'error' },
    );
  });

  test('reports error on invalid argument values - optional Object', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        interface Baz {
          readonly x: string;
        }

        interface Foo {
          bar(value?: Baz): number;
        }

        Address.getSmartContract<Foo>(Address.from('${keys[0].address}'));
      `,
      { type: 'error' },
    );
  });

  test('reports error on invalid argument return - Object', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        interface Baz {
          readonly x: string;
        }

        interface Foo {
          bar(value: number): Baz;
        }

        Address.getSmartContract<Foo>(Address.from('${keys[0].address}'));
      `,
      { type: 'error' },
    );
  });

  test('reports error on invalid argument return - union string | number', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        interface Foo {
          bar(value: number): number | string;
        }

        const sc = Address.getSmartContract<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on multiple call signatures', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        interface Foo {
          bar(value: number): number | undefined;
          bar(value: string): string | undefined;
        }

        const sc = Address.getSmartContract<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on any parameter', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        interface Foo {
          bar(value: any): number | undefined;
        }

        const sc = Address.getSmartContract<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on any return', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        interface Foo {
          bar(value: number): any;
        }

        const sc = Address.getSmartContract<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on missing return', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        interface Foo {
          bar(value: number);
        }

        const sc = Address.getSmartContract<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on any smart contract type', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        const sc = Address.getSmartContract<any>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on non-method properties', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        interface Foo {
          bar: number;
        }

        const sc = Address.getSmartContract<Foo>(Address.from('${keys[0].address}'));
        sc.bar(0);
      `,
      { type: 'error' },
    );
  });

  test('reports error on any properties', async () => {
    await helpers.compileString(
      `
        import { Address } from '@neo-one/smart-contract';

        interface Foo {
          bar: any;
        }

        const sc = Address.getSmartContract<Foo>(Address.from('${keys[0].address}'));
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
      import { Address } from '@neo-one/smart-contract';
      import { getArgument } from '@neo-one/smart-contract-internal';

      interface Contract {
        run(value: number): boolean;
      }
      const contract = Address.getSmartContract<Contract>(getArgument<[Address]>(1)[0]);
      assertEqual(contract.run(10), true);
    `);

    await node.executeString(`
      import { Address } from '@neo-one/smart-contract';

      interface Contract {
        run(value: Address): void;
      }
      const contract = Address.getSmartContract<Contract>(Address.from('${callingContract.hash}'));
      contract.run(Address.from('${dynamicContract.hash}'));
    `);
  });
});
