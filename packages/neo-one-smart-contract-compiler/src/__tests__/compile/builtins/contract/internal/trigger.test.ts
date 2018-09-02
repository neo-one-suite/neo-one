import { helpers } from '../../../../../__data__';

describe('trigger', () => {
  test('is application', async () => {
    await helpers.executeString(`
      import { trigger } from '@neo-one/smart-contract-internal';

      trigger;
      assertEqual(trigger, 0x10);
    `);
  });
});
