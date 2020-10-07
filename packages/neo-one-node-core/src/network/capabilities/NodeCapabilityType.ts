import { InvalidFormatError } from '@neo-one/client-common';

export enum NodeCapabilityType {
  TcpServer = 0x01,
  WsServer = 0x02,
  FullNode = 0x10,
}

export const isNodeCapabilityType = (value: number): value is NodeCapabilityType =>
  // tslint:disable-next-line: strict-type-predicates
  NodeCapabilityType[value] !== undefined;

export const assertNodeCapabilityType = (value: number): NodeCapabilityType => {
  if (isNodeCapabilityType(value)) {
    return value;
  }

  throw new InvalidFormatError(`Expected NodeCapabilityType, found: ${value}`);
};
