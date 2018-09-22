import { common } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { helpers, keys } from '../../../../__data__';

describe('Blockchain', () => {
  test('currentHeight', async () => {
    const node = await helpers.startNode();

    await node.executeString(`
      import { Blockchain } from '@neo-one/smart-contract';

      const x = Blockchain;
      assertEqual(x.currentHeight === 0 || x.currentHeight === 1, true);
    `);
  });

  test('set currentHeight', async () => {
    helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentHeight = 10;
    `,
      { type: 'error' },
    );
  });

  test('currentBlockTime', async () => {
    const node = await helpers.startNode();

    await node.executeString(`
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentBlockTime;
      assertEqual(Blockchain.currentBlockTime > 0, true);
    `);
  });

  test('set currentBlockTime', async () => {
    helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentBlockTime = 10;
    `,
      { type: 'error' },
    );
  });

  test('currentTransaction', async () => {
    const node = await helpers.startNode();

    const data = Buffer.from('Hello World', 'utf8').toString('hex');

    await node.executeString(
      `
      import { AttributeUsage, Blockchain, TransactionType } from '@neo-one/smart-contract';

      const { currentTransaction: transaction } = Blockchain;

      assertEqual(transaction.type, TransactionType.Invocation);

      const attributes = transaction.attributes;
      assertEqual(attributes.length, 3);

      const attribute = attributes[0];

      assertEqual(attribute.usage, AttributeUsage.Description);
      assertEqual(attribute.data.equals(${helpers.getBufferHash(data)}), true)

      assertEqual(transaction.inputs.length, 1);
      assertEqual(transaction.outputs.length, 2);
      assertEqual(transaction.references.length, 1);
      assertEqual(transaction.unspentOutputs.length, 2);
    `,
      {
        transfers: [
          {
            to: keys[0].address,
            amount: new BigNumber(10),
            asset: common.NEO_ASSET_HASH,
          },
        ],
        attributes: [
          {
            usage: 'Description',
            data,
          },
        ],
      },
    );
  });

  test('set currentTransaction', async () => {
    helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentTransaction = Blockchain.currentTransaction;
    `,
      { type: 'error' },
    );
  });
});
