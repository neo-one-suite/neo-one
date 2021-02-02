import { CallReceiptJSON, SourceMaps } from '@neo-one/client-common';
import { convertCallReceipt } from '@neo-one/client-core';
import { createConsoleLogMessages } from '@neo-one/client-switch';
import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

const getMessages = async (receiptIn: CallReceiptJSON, sourceMaps: SourceMaps): Promise<ReadonlyArray<string>> => {
  const receipt = convertCallReceipt(receiptIn);

  return createConsoleLogMessages([...receipt.notifications, ...receipt.logs], sourceMaps, { onlyFileName: true });
};

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('console.log', () => {
  test('should log strings', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      console.log('hello ', 'world');
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages.length).toEqual(1);
    expect(messages).toMatchSnapshot();
  });

  test('should log numbers', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      console.log(0, 1);
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should log booleans', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      console.log(true, false);
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should log symbols', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      console.log(Symbol.for('a'));
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should log undefined', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      console.log(undefined);
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should log null', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      console.log(null);
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should log arrays', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      console.log([[1, 2, 3], ['a'], [[Symbol.for('b')]]]);
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should log maps', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      const map = new Map();
      map.set('a', 1);
      map.set('b', 2);
      map.set('c', 3);
      console.log(map);
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should log sets', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      const set = new Set([1, 2, 3]);
      console.log(set);
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should log buffers', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      console.log(Buffer.from('ab', 'hex'));
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should log objects', async () => {
    // TODO
    const { receipt, sourceMaps } = await helpers.executeString(`
      console.log({
        a: 'a',
        b: [{ a: 'a' }],
      });
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should handle multiple log', async () => {
    const { receipt, sourceMaps } = await helpers.executeString(`
      const bar = () => {
        console.log('bar');
      }
      const foo = () => {
        console.log('calling bar');
        bar();
        console.log('done calling bar');
      };

      console.log('calling foo');
      foo();
      console.log('done');
    `);

    const messages = await getMessages(receipt, sourceMaps);

    expect(messages).toMatchSnapshot();
  });

  test('should handle logs across contracts', async () => {
    // TODO
    const node = await helpers.startNode();
    const firstContract = await node.addContract(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class FirstContract extends SmartContract {
        ${properties}

        public run(): void {
          const bar = () => {
            console.log('bar');
          }
          const foo = () => {
            console.log('calling bar');
            bar();
            console.log('done calling bar');
          };

          console.log('calling foo');
          foo();
          console.log('done calling foo');
        }
      }
    `,
      {
        fileName: 'firstContract.ts',
      },
    );

    const secondContract = await node.addContract(
      `
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class SecondContract extends SmartContract {
        ${properties}

        public run(): void {
          interface Contract {
            readonly run: () => void;
          }

          const invoke = () => {
            console.log('calling run');
            const contract = SmartContract.for<Contract>(Address.from('${firstContract.address}'));
            contract.run();
            console.log('done calling run');
          };

          console.log('calling invoke');
          invoke();
          console.log('done calling invoke');
        }
      }
    `,
      { fileName: 'secondContract.ts' },
    );

    const { receipt, sourceMaps } = await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly run: () => void;
      }

      const contract = SmartContract.for<Contract>(Address.from('${secondContract.address}'));
      console.log('calling second contract');
      contract.run();
      console.log('done');
    `);

    const messages = await createConsoleLogMessages([...receipt.notifications, ...receipt.logs], sourceMaps, {
      onlyFileName: true,
    });

    expect(messages).toMatchSnapshot();
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const log = console.log;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be referenced - object literal', async () => {
    await helpers.compileString(
      `
      const { log } = console;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
