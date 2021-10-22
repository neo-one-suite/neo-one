import { utils } from '@neo-one/utils';
import { createDeserializeWire, DeserializeWireBaseOptions } from '../Serializable';
import { BlockAccountPolicyChange } from './BlockAccountPolicyChange';
import { ExecFeeFactorPolicyChange } from './ExecFeeFactorPolicyChange';
import { FeePerBytePolicyChange } from './FeePerBytePolicyChange';
import { GasPerBlockPolicyChange } from './GasPerBlockPolicyChange';
import { MinimumDeploymentFeePolicyChange } from './MinimumDeploymentFeePolicyChange';
import { assertPolicyChangeType, PolicyChangeType } from './PolicyChangeType';
import { RegisterCandidatePolicyChange } from './RegisterCandidatePolicyChange';
import { RegisterPricePolicyChange } from './RegisterPricePolicyChange';
import { RoleDesignationPolicyChange } from './RoleDesignationPolicyChange';
import { StoragePricePolicyChange } from './StoragePricePolicyChange';
import { UnblockAccountPolicyChange } from './UnblockAccountPolicyChange';
import { UnregisterCandidatePolicyChange } from './UnregisterCandidatePolicyChange';

export type PolicyChange =
  | GasPerBlockPolicyChange
  | RegisterPricePolicyChange
  | FeePerBytePolicyChange
  | ExecFeeFactorPolicyChange
  | StoragePricePolicyChange
  | MinimumDeploymentFeePolicyChange
  | UnregisterCandidatePolicyChange
  | RegisterCandidatePolicyChange
  | RoleDesignationPolicyChange
  | BlockAccountPolicyChange
  | UnblockAccountPolicyChange;

export const deserializePolicyChangeWireBase = (options: DeserializeWireBaseOptions): PolicyChange => {
  const { reader } = options;
  const type = assertPolicyChangeType(reader.clone().readUInt8());
  switch (type) {
    case PolicyChangeType.GasPerBlock:
      return GasPerBlockPolicyChange.deserializeWireBase(options);
    case PolicyChangeType.RegisterPrice:
      return RegisterPricePolicyChange.deserializeWireBase(options);
    case PolicyChangeType.FeePerByte:
      return FeePerBytePolicyChange.deserializeWireBase(options);
    case PolicyChangeType.ExecFeeFactor:
      return ExecFeeFactorPolicyChange.deserializeWireBase(options);
    case PolicyChangeType.StoragePrice:
      return StoragePricePolicyChange.deserializeWireBase(options);
    case PolicyChangeType.MinimumDeploymentFee:
      return MinimumDeploymentFeePolicyChange.deserializeWireBase(options);
    case PolicyChangeType.UnregisterCandidate:
      return UnregisterCandidatePolicyChange.deserializeWireBase(options);
    case PolicyChangeType.RegisterCandidate:
      return RegisterCandidatePolicyChange.deserializeWireBase(options);
    case PolicyChangeType.RoleDesignation:
      return RoleDesignationPolicyChange.deserializeWireBase(options);
    case PolicyChangeType.BlockAccount:
      return BlockAccountPolicyChange.deserializeWireBase(options);
    case PolicyChangeType.UnblockAccount:
      return UnblockAccountPolicyChange.deserializeWireBase(options);
    default:
      utils.assertNever(type);
      throw new Error('For TS');
  }
};

export const deserializePolicyChangeWire = createDeserializeWire(deserializePolicyChangeWireBase);
