import { helpers } from '../../../../__data__';

describe('SetStorage', () => {
  test('add, set, delete', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { SetStorage } from '@neo-one/smart-contract';

      const storage = new SetStorage<string>(Buffer.from('prefix', 'utf8'));
      assertEqual(storage.has('foo'), false);

      storage.delete('foo');
      storage.add('foo');
      assertEqual(storage.has('foo'), true);

      storage.delete('foo');
      assertEqual(storage.has('foo'), false);
    `);

    await node.executeString(`
      import { Address } from '@neo-one/smart-contract';

      interface Contract {
        run(): void;
      }
      const contract = Address.getSmartContract<Contract>(Address.from('${contract.address}'));
      contract.run();
    `);
  });
});
