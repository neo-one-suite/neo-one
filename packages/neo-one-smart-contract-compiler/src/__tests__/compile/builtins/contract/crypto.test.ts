import { crypto } from '@neo-one/client-common';
import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('crypto', () => {
  test('ripemd160', async () => {
    const value = Buffer.alloc(4, 0x10);
    const expected = crypto.rmd160(value);
    await helpers.executeString(`
      import { crypto } from '@neo-one/smart-contract';

      const result = crypto.ripemd160(${helpers.getBuffer(value)})
      assertEqual(result, ${helpers.getBuffer(expected)})
    `);
  });

  test('ripemd160 cannot be referenced', async () => {
    await helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const ripemd160 = crypto.ripemd160;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('ripemd160 cannot be referenced - object literal', async () => {
    await helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const { ripemd160 } = crypto;
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
    await helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const sha256 = crypto.sha256;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('sha256 cannot be referenced - object literal', async () => {
    await helpers.compileString(
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
    await helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const hash160 = crypto.hash160;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('hash160 cannot be referenced - object literal', async () => {
    await helpers.compileString(
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
    await helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const hash256 = crypto.hash256;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('hash256 cannot be referenced - object literal', async () => {
    await helpers.compileString(
      `
      import { crypto } from '@neo-one/smart-contract';

      const { hash256 } = crypto;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
