import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Transaction', () => {
  test('properties', async () => {
    const node = await helpers.startNode();
    const { transaction } = await node.executeString(``);
    await node.executeString(
      `
      import { Transaction, Address, Hash256 } from '@neo-one/smart-contract';

      const transaction = Transaction.for(Hash256.from('${transaction.hash}'));

      assertEqual(transaction instanceof Transaction, true);
      assertEqual(transaction.hash, Hash256.from('${transaction.hash}'));
      assertEqual(transaction.version, ${transaction.version});
      assertEqual(transaction.nonce, ${transaction.nonce});
      assertEqual(transaction.sender, Address.from('${transaction.sender}'));
      assertEqual(transaction.systemFee, ${transaction.systemFee.toString()});
      assertEqual(transaction.networkFee, ${transaction.networkFee.toString()});
      assertEqual(transaction.validUntilBlock, ${transaction.validUntilBlock});
      assertEqual(transaction.height, 1);
      assertEqual(transaction.script, ${helpers.getBufferHash(transaction.script, 'base64')});
    `,
    );
  });

  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { Transaction } from '@neo-one/smart-contract';

      class MyTransaction implements Transaction {
      }
    `,
      { type: 'error' },
    );
  });

  test('invalid reference', async () => {
    await helpers.compileString(
      `
      import { Transaction } from '@neo-one/smart-contract';

      const for = Transaction.for;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid "reference"', async () => {
    await helpers.compileString(
      `
      import { Transaction } from '@neo-one/smart-contract';

      const for = Transaction['for'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid reference - object', async () => {
    await helpers.compileString(
      `
      import { Transaction } from '@neo-one/smart-contract';

      const { for } = Transaction;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
