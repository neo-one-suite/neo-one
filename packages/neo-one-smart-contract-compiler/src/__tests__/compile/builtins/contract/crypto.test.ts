import { crypto } from '@neo-one/client-common';
import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('crypto', () => {
  test('sha1', async () => {
    const value = Buffer.alloc(4, 0x10);
    const expected = crypto.sha1(value);
    await helpers.executeString(`
      import { crypto } from '@neo-one/smart-contract';

      const result = crypto.sha1(${helpers.getBuffer(value)})
      assertEqual(result, ${helpers.getBuffer(expected)})
    `);
  });

  test('sha1 cannot be referenced', async () => {
    helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const sha1 = crypto.sha1;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('sha1 cannot be referenced - object literal', async () => {
    helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const { sha1 } = crypto;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('sha256', async () => {
    const value = Buffer.alloc(4, 0x10);
    const expected = crypto.sha256(value);
    await helpers.executeString(`
      import { crypto } from '@neo-one/smart-contract';

      const result = crypto.sha256(${helpers.getBuffer(value)})
      assertEqual(result, ${helpers.getBuffer(expected)})
    `);
  });

  test('sha256 cannot be referenced', async () => {
    helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const sha256 = crypto.sha256;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('sha256 cannot be referenced - object literal', async () => {
    helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const { sha256 } = crypto;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('hash160', async () => {
    const value = Buffer.alloc(4, 0x10);
    const expected = crypto.hash160(value);
    await helpers.executeString(`
      import { crypto } from '@neo-one/smart-contract';

      const result = crypto.hash160(${helpers.getBuffer(value)})
      assertEqual(result, ${helpers.getBuffer(expected)})
    `);
  });

  test('hash160 cannot be referenced', async () => {
    helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const hash160 = crypto.hash160;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('hash160 cannot be referenced - object literal', async () => {
    helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const { hash160 } = crypto;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('hash256', async () => {
    const value = Buffer.alloc(4, 0x10);
    const expected = crypto.hash256(value);
    await helpers.executeString(`
      import { crypto } from '@neo-one/smart-contract';

      const result = crypto.hash256(${helpers.getBuffer(value)})
      assertEqual(result, ${helpers.getBuffer(expected)})
    `);
  });

  test('hash256 cannot be referenced', async () => {
    helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const hash256 = crypto.hash256;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('hash256 cannot be referenced - object literal', async () => {
    helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const { hash256 } = crypto;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
