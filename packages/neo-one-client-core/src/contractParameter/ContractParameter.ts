import {
  createDeserializeWire,
  DeserializeWire,
  DeserializeWireBaseOptions,
} from '../Serializable';
import {
  ArrayContractParameter,
  ArrayContractParameterJSON,
} from './ArrayContractParameter';
import {
  BooleanContractParameter,
  BooleanContractParameterJSON,
} from './BooleanContractParameter';
import {
  ByteArrayContractParameter,
  ByteArrayContractParameterJSON,
} from './ByteArrayContractParameter';
import {
  assertContractParameterType,
  ContractParameterType,
} from './ContractParameterType';
import {
  Hash160ContractParameter,
  Hash160ContractParameterJSON,
} from './Hash160ContractParameter';
import {
  Hash256ContractParameter,
  Hash256ContractParameterJSON,
} from './Hash256ContractParameter';
import {
  IntegerContractParameter,
  IntegerContractParameterJSON,
} from './IntegerContractParameter';
import {
  InteropInterfaceContractParameter,
  InteropInterfaceContractParameterJSON,
} from './InteropInterfaceContractParameter';
import {
  PublicKeyContractParameter,
  PublicKeyContractParameterJSON,
} from './PublicKeyContractParameter';
import {
  SignatureContractParameter,
  SignatureContractParameterJSON,
} from './SignatureContractParameter';
import {
  StringContractParameter,
  StringContractParameterJSON,
} from './StringContractParameter';
import {
  VoidContractParameter,
  VoidContractParameterJSON,
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

export const deserializeContractParameterWireBase = (
  options: DeserializeWireBaseOptions,
): ContractParameter => {
  const { reader } = options;
  const type = assertContractParameterType(reader.clone().readUInt8());
  switch (type) {
    case ContractParameterType.Signature:
      return SignatureContractParameter.deserializeWireBase(options);
    case ContractParameterType.Boolean:
      return BooleanContractParameter.deserializeWireBase(options);
    case ContractParameterType.Integer:
      return IntegerContractParameter.deserializeWireBase(options);
    case ContractParameterType.Hash160:
      return Hash160ContractParameter.deserializeWireBase(options);
    case ContractParameterType.Hash256:
      return Hash256ContractParameter.deserializeWireBase(options);
    case ContractParameterType.ByteArray:
      return ByteArrayContractParameter.deserializeWireBase(options);
    case ContractParameterType.PublicKey:
      return PublicKeyContractParameter.deserializeWireBase(options);
    case ContractParameterType.String:
      return StringContractParameter.deserializeWireBase(options);
    case ContractParameterType.Array:
      return (ArrayContractParameter as any).deserializeWireBase(options);
    case ContractParameterType.InteropInterface:
      return InteropInterfaceContractParameter.deserializeWireBase(options);
    case ContractParameterType.Void:
      return VoidContractParameter.deserializeWireBase(options);
  }
};

export const deserializeWire: DeserializeWire<
  ContractParameter
> = createDeserializeWire(deserializeContractParameterWireBase);

(ArrayContractParameter as any).deserializeWireBase = (
  options: DeserializeWireBaseOptions,
): ArrayContractParameter => {
  const { reader } = options;
  reader.readUInt8();
  const value = reader.readArray(() =>
    deserializeContractParameterWireBase(options),
  );
  return new ArrayContractParameter(value);
};

(ArrayContractParameter as any).deserializeWire = createDeserializeWire(
  (ArrayContractParameter as any).deserializeWireBase.bind(
    ArrayContractParameter,
  ),
);
