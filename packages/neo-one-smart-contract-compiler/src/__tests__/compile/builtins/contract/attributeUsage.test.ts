import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('AttributeUsage', () => {
  test('properties', async () => {
    await helpers.executeString(`
      import { AttributeUsage } from '@neo-one/smart-contract';
      assertEqual(AttributeUsage.ContractHash, 0x00);
      assertEqual(AttributeUsage.ECDH02, 0x02);
      assertEqual(AttributeUsage.ECDH03, 0x03);
      assertEqual(AttributeUsage.Script, 0x20);
      assertEqual(AttributeUsage.Vote, 0x30);
      assertEqual(AttributeUsage.DescriptionUrl, 0x81);
      assertEqual(AttributeUsage.Description, 0x90);
      assertEqual(AttributeUsage.Hash1, 0xa1);
      assertEqual(AttributeUsage.Hash2, 0xa2);
      assertEqual(AttributeUsage.Hash3, 0xa3);
      assertEqual(AttributeUsage.Hash4, 0xa4);
      assertEqual(AttributeUsage.Hash5, 0xa5);
      assertEqual(AttributeUsage.Hash6, 0xa6);
      assertEqual(AttributeUsage.Hash7, 0xa7);
      assertEqual(AttributeUsage.Hash8, 0xa8);
      assertEqual(AttributeUsage.Hash9, 0xa9);
      assertEqual(AttributeUsage.Hash10, 0xaa);
      assertEqual(AttributeUsage.Hash11, 0xab);
      assertEqual(AttributeUsage.Hash12, 0xac);
      assertEqual(AttributeUsage.Hash13, 0xad);
      assertEqual(AttributeUsage.Hash14, 0xae);
      assertEqual(AttributeUsage.Hash15, 0xaf);
      assertEqual(AttributeUsage.Remark, 0xf0);
      assertEqual(AttributeUsage.Remark1, 0xf1);
      assertEqual(AttributeUsage.Remark2, 0xf2);
      assertEqual(AttributeUsage.Remark3, 0xf3);
      assertEqual(AttributeUsage.Remark4, 0xf4);
      assertEqual(AttributeUsage.Remark5, 0xf5);
      assertEqual(AttributeUsage.Remark6, 0xf6);
      assertEqual(AttributeUsage.Remark7, 0xf7);
      assertEqual(AttributeUsage.Remark8, 0xf8);
      assertEqual(AttributeUsage.Remark9, 0xf9);
      assertEqual(AttributeUsage.Remark10, 0xfa);
      assertEqual(AttributeUsage.Remark11, 0xfb);
      assertEqual(AttributeUsage.Remark12, 0xfc);
      assertEqual(AttributeUsage.Remark13, 0xfd);
      assertEqual(AttributeUsage.Remark14, 0xfe);
      assertEqual(AttributeUsage.Remark15, 0xff);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      import { AttributeUsage } from '@neo-one/smart-contract';

      const x = AttributeUsage;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
