import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';
import { createConsoleLogMessages, RawCallReceipt, NEOONEDataProvider } from '@neo-one/client';
import { CallReceiptJSON } from '@neo-one/client-core';
import { RawSourceMap } from 'source-map';
import { ConsoleLog } from '../../../../compile/builtins/console/log';

const getMessages = async (receiptIn: CallReceiptJSON, sourceMap: RawSourceMap): Promise<ReadonlyArray<string>> => {
  const receipt: RawCallReceipt = (new NEOONEDataProvider({ network: 'meh', rpcURL: 'meh' }) as any).convertCallReceipt(
    receiptIn,
  );

  return createConsoleLogMessages(receipt.actions, sourceMap, { bare: true });
};

describe('console.log', () => {
  test('should log strings', async () => {
    const { receipt, sourceMap } = await helpers.executeString(`
      console.log('hello ', 'world');
    `);

    const messages = await getMessages(receipt, sourceMap);

    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual('hello world');
  });

  test('should log numbers', async () => {
    const { receipt, sourceMap } = await helpers.executeString(`
      console.log(0, 1);
    `);

    const messages = await getMessages(receipt, sourceMap);

    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual('01');
  });

  test('should log booleans', async () => {
    const { receipt, sourceMap } = await helpers.executeString(`
      console.log(true, false);
    `);

    const messages = await getMessages(receipt, sourceMap);

    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual('truefalse');
  });

  test('should log symbols', async () => {
    const { receipt, sourceMap } = await helpers.executeString(`
      console.log(Symbol.for('a'));
    `);

    const messages = await getMessages(receipt, sourceMap);

    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual('Symbol(a)');
  });

  test('should log undefined', async () => {
    const { receipt, sourceMap } = await helpers.executeString(`
      console.log(undefined);
    `);

    const messages = await getMessages(receipt, sourceMap);

    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual('');
  });

  test('should log null', async () => {
    const { receipt, sourceMap } = await helpers.executeString(`
      console.log(null);
    `);

    const messages = await getMessages(receipt, sourceMap);

    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual('null');
  });

  test('should log arrays', async () => {
    const { receipt, sourceMap } = await helpers.executeString(`
      console.log([[1, 2, 3], ['a'], [[Symbol.for('b')]]]);
    `);

    const messages = await getMessages(receipt, sourceMap);

    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual('[[1,2,3],["a"],[["Symbol(b)"]]]');
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const log = console.log;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('canCall should throw an error', () => {
    expect(() => new ConsoleLog().canCall()).toThrow();
  });
});
