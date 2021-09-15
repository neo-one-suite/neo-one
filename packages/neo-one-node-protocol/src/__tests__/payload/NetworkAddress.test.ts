import { FullNodeCapability, NodeCapabilityType, ServerCapability } from '@neo-one/node-core';
import { NetworkAddress } from '../../payload';

describe('NetworkAddress', () => {
  const capabilities = [
    new ServerCapability({ type: NodeCapabilityType.TcpServer, port: 8080 }),
    new FullNodeCapability({ startHeight: 1 }),
  ];
  test('serde ipv4', () => {
    const timestamp = Math.round(Date.now() / 1000);
    const address = new NetworkAddress({
      address: '10.8.4.78',
      capabilities,
      timestamp,
    });

    const serialized = address.serializeWire();
    // tslint:disable-next-line no-any
    const deserialized = NetworkAddress.deserializeWire({ buffer: serialized } as any);

    const expected = new NetworkAddress({
      address: '0000:0000:0000:0000:0000:ffff:0a08:044e',
      capabilities,
      timestamp,
    });

    expect(deserialized.address).toEqual(expected.address);
    const deserializeFullNodeCap = deserialized.capabilities.find((cap) => cap.type === NodeCapabilityType.FullNode);
    const expectedFullNodeCap = expected.capabilities.find((cap) => cap.type === NodeCapabilityType.FullNode);
    expect(deserializeFullNodeCap).toBeDefined();
    expect(expectedFullNodeCap).toBeDefined();
    expect((deserializeFullNodeCap as FullNodeCapability).type).toEqual(
      (expectedFullNodeCap as FullNodeCapability).type,
    );
    expect((deserializeFullNodeCap as FullNodeCapability).startHeight).toEqual(
      (expectedFullNodeCap as FullNodeCapability).startHeight,
    );

    const deserializeServerCap = deserialized.capabilities.find((cap) => cap.type === NodeCapabilityType.TcpServer);
    const expectedServerCap = expected.capabilities.find((cap) => cap.type === NodeCapabilityType.TcpServer);
    expect(deserializeServerCap).toBeDefined();
    expect(expectedServerCap).toBeDefined();
    expect((deserializeServerCap as ServerCapability).type).toEqual((expectedServerCap as ServerCapability).type);
    expect((deserializeServerCap as ServerCapability).port).toEqual((expectedServerCap as ServerCapability).port);

    expect(deserialized.timestamp).toEqual(expected.timestamp);
  });
});
