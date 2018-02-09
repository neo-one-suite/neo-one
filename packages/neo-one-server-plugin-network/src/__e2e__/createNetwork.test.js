/* @flow */

describe('create network', () => {
  test('create network priv', async () => {
    await one.execute('create network priv');

    await new Promise(resolve => setTimeout(() => resolve(), 10000));
    const output = await one.execute('describe network priv --json');

    const description = JSON.parse(output);
    expect(description[0]).toEqual(['Name', 'priv']);
    expect(description[1]).toEqual(['Type', 'private']);
    expect(description[3][1].table[1][0]).toEqual('priv-0');
    expect(description[3][1].table[1][1]).toEqual('Yes');
    expect(description[3][1].table[1][2]).toEqual('Yes');
    expect(parseInt(description[3][1].table[1][5], 10)).toBeGreaterThan(1);
    expect(description[3][1].table[1][6]).toEqual('0');
  });
});
