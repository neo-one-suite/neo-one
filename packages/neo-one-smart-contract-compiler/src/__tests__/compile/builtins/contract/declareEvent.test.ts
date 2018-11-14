import { helpers } from '../../../../__data__';

describe('declareEvent', () => {
  test('simple event', async () => {
    const node = await helpers.startNode();
    const { definition } = await node.addContractWithDefinition(`
      import { declareEvent, SmartContract } from '@neo-one/smart-contract';

      declareEvent<number, string, boolean>('event', 'number', 'string', 'boolean');

      export class Contract extends SmartContract {

      }
    `);

    expect(definition.abi.events).toHaveLength(1);
    const events = definition.abi.events;
    if (events !== undefined) {
      expect(events[0].name).toEqual('event');
    }
  });

  test('invalid event name', async () => {
    helpers.compileString(
      `
      import { declareEvent, SmartContract } from '@neo-one/smart-contract';

      const foo = 'event';
      declareEvent(foo);

      export class Contract extends SmartContract {

      }
    `,
      { type: 'error' },
    );
  });

  test('invalid event parameter type', async () => {
    helpers.compileString(
      `
      import { declareEvent, SmartContract } from '@neo-one/smart-contract';

      class Foo {}
      declareEvent<Foo>('foo');

      export class Contract extends SmartContract {

      }
    `,
      { type: 'error' },
    );
  });

  test('invalid event parameter type - forward value', async () => {
    helpers.compileString(
      `
      import { declareEvent, SmartContract } from '@neo-one/smart-contract';

      declareEvent<ForwardValue<string>>('foo');

      export class Contract extends SmartContract {

      }
    `,
      { type: 'error' },
    );
  });
});
