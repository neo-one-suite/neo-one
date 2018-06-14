import { utils } from '@neo-one/utils';
import {
  createDeserializeWire,
  DeserializeWire,
  DeserializeWireBase,
  DeserializeWireBaseOptions,
} from '../Serializable';
import { ArrayContractParameter, ArrayContractParameterJSON } from './ArrayContractParameter';
import { BooleanContractParameter, BooleanContractParameterJSON } from './BooleanContractParameter';
import { ByteArrayContractParameter, ByteArrayContractParameterJSON } from './ByteArrayContractParameter';
import { ContractParameterBase } from './ContractParameterBase';
import { assertContractParameterType, ContractParameterType } from './ContractParameterType';
import { Hash160ContractParameter, Hash160ContractParameterJSON } from './Hash160ContractParameter';
import { Hash256ContractParameter, Hash256ContractParameterJSON } from './Hash256ContractParameter';
import { IntegerContractParameter, IntegerContractParameterJSON } from './IntegerContractParameter';
import {
  InteropInterfaceContractParameter,
  InteropInterfaceContractParameterJSON,
} from './InteropInterfaceContractParameter';
import { PublicKeyContractParameter, PublicKeyContractParameterJSON } from './PublicKeyContractParameter';
import { SignatureContractParameter, SignatureContractParameterJSON } from './SignatureContractParameter';
import { StringContractParameter, StringContractParameterJSON } from './StringContractParameter';
import { VoidContractParameter, VoidContractParameterJSON } from './VoidContractParameter';

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

export const deserializeContractParameterWireBase = (options: DeserializeWireBaseOptions): ContractParameter => {
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
      // tslint:disable-next-line
      return (ArrayContractParameter as any).deserializeWireBase(options);
    case ContractParameterType.InteropInterface:
      return InteropInterfaceContractParameter.deserializeWireBase(options);
    case ContractParameterType.Void:
      return VoidContractParameter.deserializeWireBase(options);
    default:
      utils.assertNever(type);
      throw new Error('For TS');
  }
};

export const deserializeWire = createDeserializeWire(deserializeContractParameterWireBase);

// tslint:disable-next-line no-object-mutation readonly-keyword
(ArrayContractParameter as { deserializeWireBase?: DeserializeWireBase<ContractParameterBase> }).deserializeWireBase = (
  options,
): ArrayContractParameter => {
  const { reader } = options;
  reader.readUInt8();
  const value = reader.readArray(() => deserializeContractParameterWireBase(options));

  return new ArrayContractParameter(value);
};

// tslint:disable-next-line no-object-mutation
(ArrayContractParameter as {
  // tslint:disable-next-line readonly-keyword
  deserializeWire?: DeserializeWire<ContractParameterBase>;
}).deserializeWire = createDeserializeWire(
  // tslint:disable-next-line no-any
  (ArrayContractParameter as any).deserializeWireBase.bind(ArrayContractParameter),
);
