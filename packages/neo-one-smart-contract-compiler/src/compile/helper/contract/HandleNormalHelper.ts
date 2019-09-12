// tslint:disable prefer-switch
import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { PropInfo } from '../../../contract';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { createWrapParam } from './utils';

export interface HandleNormalHelperOptions {
  readonly propInfo: PropInfo;
  readonly getter?: boolean;
}

// Input: []
// Output: [value]
export class HandleNormalHelper extends Helper {
  public static getKey(options: HandleNormalHelperOptions): string {
    return `${options.getter}:${options.propInfo.name}`;
  }

  private readonly propInfo: PropInfo;
  private readonly getter?: boolean;
  private mutableJump?: number;

  public constructor({ propInfo, getter }: HandleNormalHelperOptions) {
    super();
    this.propInfo = propInfo;
    this.getter = getter;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const propInfo = this.propInfo;

    const handle = () => {
      if (propInfo.type === 'function') {
        const { decl, returnType } = propInfo;
        if (ts.isPropertyDeclaration(decl)) {
          sb.context.reportUnsupported(decl);

          return;
        }

        // [number]
        sb.emitPushInt(decl, 1);
        // [arg]
        sb.emitHelper(decl, options, sb.helpers.getArgument);
        if (propInfo.claim) {
          // [arg, arg]
          sb.emitOp(decl, 'DUP');
          // [transaction, arg, arg]
          sb.emitSysCall(decl, 'System.ExecutionEngine.GetScriptContainer');
          // [arg]
          sb.emitOp(decl, 'APPEND');
        }
        sb.withScope(decl, options, (innerOptions) => {
          sb.emitHelper(
            decl,
            innerOptions,
            sb.helpers.parameters({
              params: tsUtils.parametered.getParameters(decl),
              mapParam: createWrapParam(sb),
            }),
          );
          sb.emitHelper(decl, innerOptions, sb.helpers.invokeSmartContractMethod({ method: decl }));
          sb.emitHelper(decl, innerOptions, sb.helpers.unwrapValRecursive({ type: returnType }));
        });

        return;
      }

      if (propInfo.type === 'property') {
        const { decl } = propInfo;

        sb.emitPushString(decl, propInfo.name);
        sb.emitHelper(decl, options, sb.helpers.getCommonStorage);
        sb.emitHelper(decl, options, sb.helpers.unwrapValRecursive({ type: sb.context.analysis.getType(decl) }));

        return;
      }

      if (propInfo.type === 'accessor') {
        const { propertyType } = propInfo;
        if (this.getter) {
          const { getter } = propInfo;
          if (getter !== undefined) {
            const { decl } = getter;

            sb.withScope(decl, options, (innerOptions) => {
              sb.emitHelper(decl, innerOptions, sb.helpers.invokeSmartContractMethod({ method: decl }));
              sb.emitHelper(decl, innerOptions, sb.helpers.unwrapValRecursive({ type: propertyType }));
            });
          }
        } else {
          const { setter } = propInfo;
          if (setter !== undefined) {
            const { decl } = setter;

            // [number]
            sb.emitPushInt(decl, 1);
            // [arg]
            sb.emitHelper(decl, options, sb.helpers.getArgument);
            sb.withScope(decl, options, (innerOptions) => {
              sb.emitHelper(
                decl,
                innerOptions,
                sb.helpers.parameters({
                  params: tsUtils.parametered.getParameters(decl),
                  mapParam: createWrapParam(sb),
                }),
              );
              // []
              sb.emitHelper(
                decl,
                sb.noPushValueOptions(innerOptions),
                sb.helpers.invokeSmartContractMethod({ method: decl }),
              );
              // [buffer]
              sb.emitPushBuffer(decl, Buffer.alloc(0, 0));
            });
          }
        }

        return;
      }

      if (propInfo.type === 'refundAssets') {
        sb.emitHelper(node, options, sb.helpers.refundAssets);

        return;
      }

      if (propInfo.type === 'completeSend') {
        sb.emitHelper(node, options, sb.helpers.completeSend);

        return;
      }

      if (propInfo.type === 'deploy') {
        throw new Error('Something went wrong!');
      }

      if (propInfo.type === 'upgrade') {
        sb.emitHelper(node, options, sb.helpers.upgrade({ approveUpgrade: propInfo.approveUpgrade }));

        return;
      }

      utils.assertNever(propInfo);
    };

    let jump = this.mutableJump;
    if (jump === undefined) {
      this.mutableJump = sb.jumpTable.add(sb, node, () => {
        handle();
        sb.emitHelper(node, options, sb.helpers.return);
      });
      jump = this.mutableJump;
    }

    sb.emitPushInt(node, jump);
    sb.emitCall(node);
    sb.emitHelper(node, optionsIn, sb.helpers.handleCompletion);
  }
}
