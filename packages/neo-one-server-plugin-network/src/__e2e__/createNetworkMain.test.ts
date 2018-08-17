import { Network } from '../NetworkResourceType';
import fetch from 'cross-fetch';

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
      expect(description.height).toBeGreaterThan(5);
      expect(description.peers).toBeGreaterThan(5);

      const endpoint = description.nodes[0].telemetryAddress;
      const response = await fetch(endpoint);
      expect(response.ok).toEqual(true);

      const body = await response.text();
      const metrics = body.split('\n').filter((line) => line.includes('# TYPE') && line.includes('neo_'));
      expect(metrics).toMatchSnapshot();
    });
  });
});
