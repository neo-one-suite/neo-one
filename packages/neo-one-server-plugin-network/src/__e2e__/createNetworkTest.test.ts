import fetch from 'cross-fetch';
import { Network } from '../NetworkResourceType';

describe('create network', () => {
  test('create network test', async () => {
    await one.execute('create network test');

    await one.until(async () => {
      const output = await one.execute('describe network test --json');

      const description: Network = one.parseJSON(output);
      expect(description.name).toEqual('test');
      expect(description.type).toEqual('test');
      expect(description.nodes[0].name).toEqual('test');
      expect(description.nodes[0].live).toBeTruthy();
      expect(description.nodes[0].ready).toBeFalsy();
      expect(description.height).toBeGreaterThan(5);
      expect(description.peers).toBeGreaterThan(5);

      const endpoint = description.nodes[0].telemetryAddress;
      const response = await fetch(endpoint);
      expect(response.ok).toEqual(true);

      const body = await response.text();
      const metrics = body.split('\n').filter((line) => line.includes('# TYPE') && line.includes('neo_'));
      // tslint:disable-next-line no-array-mutation
      metrics.sort();
      expect(metrics).toMatchSnapshot();
    });
  });
});
