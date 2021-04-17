import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';
import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';
import { UnwrapHelper } from '../UnwrapHelper';
import { WrapHelper } from '../WrapHelper';

export class UnwrapContractManifestHelper extends UnwrapHelper {}
export class WrapContractManifestHelper extends WrapHelper {
  protected readonly type = Types.ContractManifest;
}
export class IsContractManifestHelper extends IsHelper {
  protected readonly type = Types.ContractManifest;
}

export const hasContractManifest = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isContractManifest(context, node, tpe));

export const isOnlyContractManifest = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isContractManifest(context, node, tpe));

export const isContractManifest = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'ContractManifest');
