/* @flow */
import {
  InvalidContractParameterTypeError,
  assertContractParameterType,
} from './ContractParameterType';
import {
  type DeserializeWire,
  type DeserializeWireBaseOptions,
  createDeserializeWire,
} from '../Serializable';

import SignatureContractParameter, {
  type SignatureContractParameterJSON,
} from './SignatureContractParameter';
import BooleanContractParameter, {
  type BooleanContractParameterJSON,
} from './BooleanContractParameter';
import IntegerContractParameter, {
  type IntegerContractParameterJSON,
} from './IntegerContractParameter';
import Hash160ContractParameter, {
  type Hash160ContractParameterJSON,
} from './Hash160ContractParameter';
import Hash256ContractParameter, {
  type Hash256ContractParameterJSON,
} from './Hash256ContractParameter';
import ByteArrayContractParameter, {
  type ByteArrayContractParameterJSON,
} from './ByteArrayContractParameter';
import PublicKeyContractParameter, {
  type PublicKeyContractParameterJSON,
} from './PublicKeyContractParameter';
import StringContractParameter, {
  type StringContractParameterJSON,
} from './StringContractParameter';
import ArrayContractParameter, {
  type ArrayContractParameterJSON,
} from './ArrayContractParameter';
import InteropInterfaceContractParameter, {
  type InteropInterfaceContractParameterJSON,
} from './InteropInterfaceContractParameter';
import VoidContractParameter, {
  type VoidContractParameterJSON,
} from './VoidContractParameter';

export type ContractParameter =
  | SignatureContractParameter
  | BooleanContractParameter
  | IntegerContractParameter
  | Hash160ContractParameter
  | Hash256ContractParameter
  | ByteArrayContractParameter
  | PublicKeyContractParameter
  | StringContractParameter
  | ArrayContractParameter
  | InteropInterfaceContractParameter
  | VoidContractParameter;

export type ContractParameterJSON =
  | SignatureContractParameterJSON
  | BooleanContractParameterJSON
  | IntegerContractParameterJSON
  | Hash160ContractParameterJSON
  | Hash256ContractParameterJSON
  | ByteArrayContractParameterJSON
  | PublicKeyContractParameterJSON
  | StringContractParameterJSON
  | ArrayContractParameterJSON
  | InteropInterfaceContractParameterJSON
  | VoidContractParameterJSON;

export const deserializeWireBase = (
  options: DeserializeWireBaseOptions,
): ContractParameter => {
  const { reader } = options;
  const type = assertContractParameterType(reader.clone().readUInt8());
  switch (type) {
    case 0x00:
      return SignatureContractParameter.deserializeWireBase(options);
    case 0x01:
      return BooleanContractParameter.deserializeWireBase(options);
    case 0x02:
      return IntegerContractParameter.deserializeWireBase(options);
    case 0x03:
      return Hash160ContractParameter.deserializeWireBase(options);
    case 0x04:
      return Hash256ContractParameter.deserializeWireBase(options);
    case 0x05:
      return ByteArrayContractParameter.deserializeWireBase(options);
    case 0x06:
      return PublicKeyContractParameter.deserializeWireBase(options);
    case 0x07:
      return StringContractParameter.deserializeWireBase(options);
    case 0x10:
      return ArrayContractParameter.deserializeWireBase(options);
    case 0xf0:
      return InteropInterfaceContractParameter.deserializeWireBase(options);
    case 0xff:
      return VoidContractParameter.deserializeWireBase(options);
    default:
      // eslint-disable-next-line
      (type: empty);
      throw new InvalidContractParameterTypeError(type);
  }
};

export const deserializeWire: DeserializeWire<
  ContractParameter,
> = createDeserializeWire(deserializeWireBase);

// $FlowFixMe
ArrayContractParameter.deserializeWireBase = (
  options: DeserializeWireBaseOptions,
): ArrayContractParameter => {
  const { reader } = options;
  reader.readUInt8();
  const value = reader.readArray(() => deserializeWireBase(options));
  return new ArrayContractParameter(value);
};

// $FlowFixMe
ArrayContractParameter.deserializeWire = createDeserializeWire(
  ArrayContractParameter.deserializeWireBase.bind(ArrayContractParameter),
);
