/* @flow */

describe('create network', () => {
  test('create network priv', async () => {
    await one.execute('create network priv');

    await one.until(async () => {
      const output = await one.execute('describe network priv --json');

      const description = one.parseJSON(output);
      expect(description[0]).toEqual(['Name', 'priv']);
      expect(description[1]).toEqual(['Type', 'private']);
      // Name
      expect(description[3][1].table[1][0]).toEqual('priv-0');
      // Live
      expect(description[3][1].table[1][1]).toEqual('Yes');
      // Ready
      expect(description[3][1].table[1][2]).toEqual('Yes');
      // Height
      expect(parseInt(description[3][1].table[1][6], 10)).toBeGreaterThan(1);
      // Peers
      expect(description[3][1].table[1][7]).toEqual('0');
    });
  });

  test('create network main', async () => {
    await one.execute('create network main');

    await one.until(async () => {
      const output = await one.execute('describe network main --json');

      const description = one.parseJSON(output);
      expect(description[0]).toEqual(['Name', 'main']);
      expect(description[1]).toEqual(['Type', 'main']);
      expect(description[3][1].table[1][0]).toEqual('main');
      expect(description[3][1].table[1][1]).toEqual('Yes');
      expect(description[3][1].table[1][2]).toEqual('No');
      expect(parseInt(description[3][1].table[1][6], 10)).toBeGreaterThan(1);
      expect(parseInt(description[3][1].table[1][7], 10)).toBeGreaterThan(1);
    });
  });

  test('create network test', async () => {
    await one.execute('create network test');

    await one.until(async () => {
      const output = await one.execute('describe network test --json');

      const description = one.parseJSON(output);
      expect(description[0]).toEqual(['Name', 'test']);
      expect(description[1]).toEqual(['Type', 'test']);
      expect(description[3][1].table[1][0]).toEqual('test');
      expect(description[3][1].table[1][1]).toEqual('Yes');
      expect(description[3][1].table[1][2]).toEqual('No');
      expect(parseInt(description[3][1].table[1][6], 10)).toBeGreaterThan(1);
      expect(parseInt(description[3][1].table[1][7], 10)).toBeGreaterThan(1);
    });
  });
});
