import { helpers, keys } from '../../../../../__data__';

describe('Address.isSender', () => {
  test('isSender - true', async () => {
    const node = await helpers.startNode();
    await node.executeString(`
      import { Address } from '@neo-one/smart-contract';

      Address.isSender(Address.from('${node.masterWallet.account.id.address}'));
      assertEqual(Address.isSender(Address.from('${node.masterWallet.account.id.address}')), true);
    `);
  });

  // Can't test this currently because during verification we always skip the witness verify check.
  test.skip('isSender - false', async () => {
    const node = await helpers.startNode();
    await node.executeString(`
      import { Address } from '@neo-one/smart-contract';

      assertEqual(Address.isSender(Address.from('${keys[1].address}')), false);
    `);
  });
});
