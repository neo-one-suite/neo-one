import { InvalidFormatError } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from '../../Serializable';
import { FullNodeCapability } from './FullNodeCapability';
import { assertNodeCapabilityType, NodeCapabilityType } from './NodeCapabilityType';
import { ServerCapability } from './ServerCapability';

export type NodeCapability = ServerCapability | FullNodeCapability;

export const deserializeNodeCapabilityWireBase = (options: DeserializeWireBaseOptions): NodeCapability => {
  const { reader } = options;
  const type = assertNodeCapabilityType(reader.clone().readInt8());

  switch (type) {
    case NodeCapabilityType.TcpServer:
    case NodeCapabilityType.WsServer:
      return ServerCapability.deserializeWireBase(options);

    case NodeCapabilityType.FullNode:
      return FullNodeCapability.deserializeWireBase(options);

    default:
      utils.assertNever(type);

      throw new InvalidFormatError(`invalid NodeCapabilityType found: ${type}`);
  }
};

export const deserializeNodeCapability = (options: DeserializeWireOptions) =>
  deserializeNodeCapabilityWireBase({
    reader: new BinaryReader(options.buffer),
    context: options.context,
  });

export const isServerCapability = (value: NodeCapability): value is ServerCapability =>
  value.type === NodeCapabilityType.TcpServer || value.type === NodeCapabilityType.WsServer;
export const isFullNodeCapability = (value: NodeCapability): value is FullNodeCapability =>
  value.type === NodeCapabilityType.FullNode;

export const assertServerCapability = (value: NodeCapability): ServerCapability => {
  if (isServerCapability(value)) {
    return value;
  }

  throw new InvalidFormatError();
};

export const assertFullNodeCapability = (value: NodeCapability): FullNodeCapability => {
  if (isFullNodeCapability(value)) {
    return value;
  }

  throw new InvalidFormatError();
};
