import { NetworkAddress, SERVICES } from '../../payload';

describe('NetworkAddress', () => {
  test('serde ipv4', () => {
    const address = new NetworkAddress({
      host: '10.8.4.78',
      port: 53788,
      services: SERVICES.NODE_NETWORK,
      timestamp: Math.round(Date.now() / 1000),
    });

    const serialized = address.serializeWire();
    // tslint:disable-next-line no-any
    const deserialized = NetworkAddress.deserializeWire({ buffer: serialized } as any);

    const expected = new NetworkAddress({
      host: '0000:0000:0000:0000:0000:ffff:0a08:044e',
      port: 53788,
      services: SERVICES.NODE_NETWORK,
      timestamp: Math.round(Date.now() / 1000),
    });
    expect(deserialized.host).toEqual(expected.host);
    expect(deserialized.port).toEqual(expected.port);
    expect(deserialized.services.toString(10)).toEqual(expected.services.toString(10));
    expect(deserialized.timestamp).toEqual(expected.timestamp);
  });
});
