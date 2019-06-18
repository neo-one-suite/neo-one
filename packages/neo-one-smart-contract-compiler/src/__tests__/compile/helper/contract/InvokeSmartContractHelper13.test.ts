import { helpers } from '../../../../__data__';

describe('InvokeSmartContractHelper', () => {
  test('uninitialized properties', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
    import { SmartContract } from '@neo-one/smart-contract';

    class Foo {
      public readonly value: string | undefined;
    }

    export class TestSmartContract extends SmartContract {
      private readonly value: string | undefined;

      public test(): boolean {
        const foo = new Foo();
        assertEqual(foo.value, undefined);
        assertEqual(this.value, undefined);

        return true;
      }
    }
  `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        test(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.test(), true);
    `);
  });
});
