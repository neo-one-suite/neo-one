import { helpers } from '../../../../__data__';

describe('createEventNotifier', () => {
  test('simple event', async () => {
    const node = await helpers.startNode();
    const { receipt: result } = await node.executeString(`
      import { createEventNotifier } from '@neo-one/smart-contract';

      createEventNotifier<number, string, boolean>('event', 'number', 'string', 'boolean');
      const onTransfer = createEventNotifier<number, string, boolean>('event', 'number', 'string', 'boolean');

      onTransfer(10, 'foo', true);
    `);

    expect(result.actions.length).toEqual(1);
    const action = result.actions[0];
    if (action.type !== 'Notification') {
      expect(action.type).toEqual('Notification');
      throw new Error('For TS');
    }
    expect(action.args.length).toEqual(4);

    // tslint:disable-next-line no-any
    const expectArg = (arg: any, type: string, value: any, mapValue: (val: any) => any) => {
      expect(arg.type).toEqual(type);
      expect(mapValue(arg.value)).toEqual(value);
    };
    expectArg(action.args[0], 'Buffer', 'event', (val) => Buffer.from(val, 'hex').toString('utf8'));
    expectArg(action.args[1], 'Integer', '10', (val) => val.toString(10));
    expectArg(action.args[2], 'Buffer', 'foo', (val) => Buffer.from(val, 'hex').toString('utf8'));
    expectArg(action.args[3], 'Integer', '1', (val) => val.toString(10));
  });

  test('invalid event name', async () => {
    helpers.compileString(
      `
      import { createEventNotifier, SmartContract } from '@neo-one/smart-contract';

      const foo = 'event';
      const onTransfer = createEventNotifier(foo);
      onTransfer();

      export class Contract extends SmartContract {}
    `,
      { type: 'error' },
    );
  });

  test('invalid event parameter type', async () => {
    helpers.compileString(
      `
      import { createEventNotifier, SmartContract } from '@neo-one/smart-contract';

      class Foo {}
      const onTransfer = createEventNotifier<Foo>('foo');
      const foo = new Foo();
      onTransfer(foo);

      export class Contract extends SmartContract {}
    `,
      { type: 'error' },
    );
  });

  test('invalid event parameter type - forward value', async () => {
    helpers.compileString(
      `
      import { createEventNotifier, SmartContract } from '@neo-one/smart-contract';

      const onTransfer = createEventNotifier<ForwardValue<string>>('foo');
      onTransfer('foo');

      export class Contract extends SmartContract {}
    `,
      { type: 'error' },
    );
  });
});
