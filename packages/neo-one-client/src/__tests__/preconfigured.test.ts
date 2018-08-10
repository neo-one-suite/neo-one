import * as preconfigured from '../preconfigured';

describe('preconfigured', () => {
  test('createReadClient', () => {
    const readClient = preconfigured.createReadClient();

    expect(readClient.dataProvider.network).toEqual('main');
  });

  test('createClient', () => {
    const client = preconfigured.createClient();

    expect(client.providers.memory.provider.getNetworks()).toEqual(['main']);
  });
});
