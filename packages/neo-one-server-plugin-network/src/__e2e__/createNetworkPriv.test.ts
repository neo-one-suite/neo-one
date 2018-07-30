import { Network } from '../NetworkResourceType';

describe('create network', () => {
  test('create network priv', async () => {
    await one.execute('create network priv');

    await one.until(async () => {
      const output = await one.execute('describe network priv --json');

      const description: Network = one.parseJSON(output);
      expect(description.name).toEqual('priv');
      expect(description.type).toEqual('private');
      expect(description.nodes[0].name).toEqual('priv-0');
      expect(description.nodes[0].live).toBeTruthy();
      expect(description.nodes[0].ready).toBeTruthy();
      expect(description.height).toBeGreaterThan(1);
      expect(description.peers).toEqual(0);
    });
  });
});
