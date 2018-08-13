import { Types } from '../../helper/types/Types';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { SysCallInstanceMemberPrimitive } from './SysCallInstanceMemberPrimitive';
import { ValueFor } from './ValueFor';
import { ValueInstanceOf } from './ValueInstanceOf';

class AssetInterface extends BuiltinInterface {}
class AssetConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Asset', new AssetInterface());
  builtins.addContractValue('Asset', new ValueInstanceOf((sb) => sb.helpers.isAsset));
  builtins.addContractMember(
    'Asset',
    'hash',
    new SysCallInstanceMemberPrimitive('Neo.Asset.GetAssetId', Types.Asset, Types.Buffer),
  );
  builtins.addContractMember(
    'Asset',
    'type',
    new SysCallInstanceMemberPrimitive('Neo.Asset.GetAssetType', Types.Asset, Types.Number),
  );
  builtins.addContractMember(
    'Asset',
    'amount',
    new SysCallInstanceMemberPrimitive('Neo.Asset.GetAmount', Types.Asset, Types.Number),
  );
  builtins.addContractMember(
    'Asset',
    'available',
    new SysCallInstanceMemberPrimitive('Neo.Asset.GetAvailable', Types.Asset, Types.Number),
  );
  builtins.addContractMember(
    'Asset',
    'precision',
    new SysCallInstanceMemberPrimitive('Neo.Asset.GetPrecision', Types.Asset, Types.Number),
  );
  builtins.addContractMember(
    'Asset',
    'owner',
    new SysCallInstanceMemberPrimitive('Neo.Asset.GetOwner', Types.Asset, Types.Buffer),
  );
  builtins.addContractMember(
    'Asset',
    'admin',
    new SysCallInstanceMemberPrimitive('Neo.Asset.GetAdmin', Types.Asset, Types.Buffer),
  );
  builtins.addContractMember(
    'Asset',
    'issuer',
    new SysCallInstanceMemberPrimitive('Neo.Asset.GetIssuer', Types.Asset, Types.Buffer),
  );

  builtins.addContractInterface('AssetConstructor', new AssetConstructorInterface());
  builtins.addContractMember(
    'AssetConstructor',
    'for',
    new ValueFor('Neo.Blockchain.GetAsset', (sb, node, options) => {
      sb.emitHelper(node, options, sb.helpers.wrapAsset);
    }),
  );
};
