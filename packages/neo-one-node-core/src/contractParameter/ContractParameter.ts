import { assertContractParameterType } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import { DeserializeWire, DeserializeWireBase, DeserializeWireBaseOptions } from '../Serializable';
import { BinaryReader } from '../utils';
import { AnyContractParameter } from './AnyContractParameter';
import { ArrayContractParameter } from './ArrayContractParameter';
import { BooleanContractParameter } from './BooleanContractParameter';
import { ByteArrayContractParameter } from './ByteArrayContractParameter';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';
import { Hash160ContractParameter } from './Hash160ContractParameter';
import { Hash256ContractParameter } from './Hash256ContractParameter';
import { IntegerContractParameter } from './IntegerContractParameter';
import { InteropInterfaceContractParameter } from './InteropInterfaceContractParameter';
import { MapContractParameter } from './MapContractParameter';
import { PublicKeyContractParameter } from './PublicKeyContractParameter';
import { SignatureContractParameter } from './SignatureContractParameter';
import { StringContractParameter } from './StringContractParameter';
import { VoidContractParameter } from './VoidContractParameter';

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
  | MapContractParameter
  | InteropInterfaceContractParameter
  | VoidContractParameter
  | AnyContractParameter;

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
    case ContractParameterType.Map:
      // tslint:disable-next-line
      return (MapContractParameter as any).deserializeWireBase(options);
    case ContractParameterType.InteropInterface:
      return InteropInterfaceContractParameter.deserializeWireBase(options);
    case ContractParameterType.Void:
      return VoidContractParameter.deserializeWireBase(options);
    case ContractParameterType.Any:
      return AnyContractParameter.deserializeWireBase(options);
    default:
      utils.assertNever(type);
      throw new Error('For TS');
  }
};

// Copied over from Serializable.ts. Oddly TS won't import this
function createDeserializeWire<T>(deserializeWireBase: DeserializeWireBase<T>): DeserializeWire<T> {
  return (options) =>
    deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
}

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

// tslint:disable-next-line no-object-mutation readonly-keyword
(MapContractParameter as { deserializeWireBase?: DeserializeWireBase<ContractParameterBase> }).deserializeWireBase = (
  options,
): MapContractParameter => {
  const { reader } = options;
  reader.readUInt8();
  const value = reader.readArray(() => reader.readArray(() => deserializeContractParameterWireBase(options)));

  // tslint:disable-next-line no-any
  return new MapContractParameter(value as any);
};

// tslint:disable-next-line no-object-mutation
(MapContractParameter as {
  // tslint:disable-next-line readonly-keyword
  deserializeWire?: DeserializeWire<ContractParameterBase>;
}).deserializeWire = createDeserializeWire(
  // tslint:disable-next-line no-any
  (MapContractParameter as any).deserializeWireBase.bind(MapContractParameter),
);
