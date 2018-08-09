import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('TransactionType', () => {
  test('properties', async () => {
    await helpers.executeString(`
      import { TransactionType } from '@neo-one/smart-contract';

      assertEqual(TransactionType.Miner, 0x00);
      assertEqual(TransactionType.Issue, 0x01);
      assertEqual(TransactionType.Claim, 0x02);
      assertEqual(TransactionType.Enrollment, 0x20);
      assertEqual(TransactionType.Register, 0x40);
      assertEqual(TransactionType.Contract, 0x80);
      assertEqual(TransactionType.State, 0x90);
      assertEqual(TransactionType.Publish, 0xd0);
      assertEqual(TransactionType.Invocation, 0xd1);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      import { TransactionType } from '@neo-one/smart-contract';

      const x = TransactionType;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
