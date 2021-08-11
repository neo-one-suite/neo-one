import { CallFlags, common } from '@neo-one/client-common';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface UpgradeHelperOptions {
  readonly approveUpgrade: ts.PropertyDeclaration | ts.MethodDeclaration;
}

// Input: []
// Output: [boolean]
export class UpgradeHelper extends Helper {
  private readonly approveUpgrade: ts.PropertyDeclaration | ts.MethodDeclaration;

  public constructor({ approveUpgrade }: UpgradeHelperOptions) {
    super();
    this.approveUpgrade = approveUpgrade;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const decl = this.approveUpgrade;
    if (ts.isPropertyDeclaration(decl)) {
      sb.context.reportUnsupported(decl);

      return;
    }

    // [booleanVal]
    sb.emitHelper(decl, options, sb.helpers.invokeSmartContractMethod({ method: decl }));
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean]
          sb.emitHelper(node, options, sb.helpers.unwrapBoolean);
        },
        whenTrue: () => {
          // [number]
          sb.emitPushInt(node, 1);
          // [arg]
          sb.emitHelper(node, options, sb.helpers.getArgument);
          // TODO: need to test this and make sure the "arg" is an array
          // first arg is nefFile and second is manifest
          // [number, arg]
          sb.emitPushInt(node, CallFlags.All);
          // ['update', number, arg]
          sb.emitPushString(node, 'update');
          // [buffer, 'update', number, arg]
          sb.emitPushBuffer(node, common.nativeHashes.ContractManagement);
          // []
          sb.emitSysCall(node, 'System.Contract.Call');
          // TODO: could be three parameters if we add the last "data" method somehow
          sb.addMethodToken(common.nativeHashes.ContractManagement, 'update', 2, false, CallFlags.All);
          // [boolean]
          sb.emitPushBoolean(node, true);
        },
        whenFalse: () => {
          sb.emitPushBoolean(node, false);
        },
      }),
    );
  }
}
