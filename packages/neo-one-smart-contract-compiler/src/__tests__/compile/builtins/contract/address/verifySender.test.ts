import { helpers, keys } from '../../../../../__data__';

describe('Address.verifySender', () => {
  test('verifySender - true', async () => {
    const node = await helpers.startNode();
    await node.executeString(`
      import { Address } from '@neo-one/smart-contract';

      Address.verifySender(Address.from('${node.masterWallet.account.id.address}'));
      assertEqual(Address.verifySender(Address.from('${node.masterWallet.account.id.address}')), true);
    `);
  });

  // Can't test this currently because during verification we always skip the witness verify check.
  test.skip('verifySender - false', async () => {
    const node = await helpers.startNode();
    await node.executeString(`
      import { Address } from '@neo-one/smart-contract';

      assertEqual(Address.verifySender(Address.from('${keys[1].address}')), false);
    `);
  });
});
