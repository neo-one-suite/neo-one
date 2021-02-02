import { helpers } from '../../../__data__';

describe('BreakStatementCompiler', () => {
  test('Basic for-loop break', async () => {
    await helpers.executeString(`
      let result = 0;
      for (let i = 0; i < 10; i++) {
        result += 10;
        if (i > 1) {
          break;
        }
      }

      if (result != 30) {
        throw 'Failure';
      }
    `);
  });

  test('Nested for-loop break', async () => {
    await helpers.executeString(`
      let result = 0;
      for (let i = 0; i < 10; i++) {
        result += 10;
        for (let j = 0; j < 10; j++) {
          if (j > 0) {
            break;
          } else {
            result += 1;
          }
        }
        if (i > 1) {
          break;
        }
      }

      if (result != 33) {
        throw 'Failure';
      }
    `);
  });

  test('break - inside SmartContract invocation', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestContract extends SmartContract {
        public foo() {
          let result = 0;
          for (let i = 0; i < 10; i++) {
            result += 10;
            if (i > 1) {
              break;
            }
          }

          if (result != 30) {
            throw 'Failure';
          }

          // checking that this code runs after the break statement
          return 10;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        foo(): number;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.foo(), 10);
    `);
  });

  test('break label', async () => {
    await helpers.compileString(
      `
      let result = 0;
      foo:
      for (let i = 0; i < 10; i++) {
        result += 10;
        for (let j = 0; j < 10; j++) {
          if (j > 0) {
            break foo;
          } else {
            result += 1;
          }
        }
        if (i > 1) {
          break foo;
        }
      }

      if (result != 33) {
        throw 'Failure';
      }
    `,
      { type: 'error' },
    );
  });
});
