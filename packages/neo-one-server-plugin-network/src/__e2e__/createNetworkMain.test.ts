import { Network } from '../NetworkResourceType';

describe('create network', () => {
  test('create network main', async () => {
    await one.execute('create network main');

    await one.until(async () => {
      const output = await one.execute('describe network main --json');

      const description: Network = one.parseJSON(output);
      expect(description.name).toEqual('main');
      expect(description.type).toEqual('main');
      expect(description.nodes[0].name).toEqual('main');
      expect(description.nodes[0].live).toBeTruthy();
      expect(description.nodes[0].ready).toBeFalsy();
      expect(description.height).toBeGreaterThan(1);
      expect(description.peers).toBeGreaterThan(1);
    });
  });
});
