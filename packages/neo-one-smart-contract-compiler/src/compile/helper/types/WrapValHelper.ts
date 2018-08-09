import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { Types, WrappableType } from './Types';

export interface WrapValHelperOptions {
  readonly type: WrappableType;
}

// Input: [val]
// Output: [value]
export class WrapValHelper extends Helper {
  private readonly type: WrappableType;
  public constructor(options: WrapValHelperOptions) {
    super();
    this.type = options.type;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    switch (this.type) {
      case Types.Array:
        sb.emitHelper(node, options, sb.helpers.wrapArray);
        break;
      case Types.Attribute:
        sb.emitHelper(node, options, sb.helpers.wrapAttribute);
        break;
      case Types.Boolean:
        sb.emitHelper(node, options, sb.helpers.wrapBoolean);
        break;
      case Types.Buffer:
        sb.emitHelper(node, options, sb.helpers.wrapBuffer);
        break;
      case Types.Input:
        sb.emitHelper(node, options, sb.helpers.wrapInput);
        break;
      case Types.Number:
        sb.emitHelper(node, options, sb.helpers.wrapNumber);
        break;
      case Types.Object:
        sb.emitHelper(node, options, sb.helpers.wrapObject);
        break;
      case Types.Output:
        sb.emitHelper(node, options, sb.helpers.wrapOutput);
        break;
      case Types.String:
        sb.emitHelper(node, options, sb.helpers.wrapString);
        break;
      case Types.Transaction:
        sb.emitHelper(node, options, sb.helpers.wrapTransaction);
        break;
      case Types.Symbol:
        sb.emitHelper(node, options, sb.helpers.wrapSymbol);
        break;
      case Types.Account:
        sb.emitHelper(node, options, sb.helpers.wrapAccount);
        break;
      case Types.Asset:
        sb.emitHelper(node, options, sb.helpers.wrapAsset);
        break;
      case Types.Contract:
        sb.emitHelper(node, options, sb.helpers.wrapContract);
        break;
      case Types.Header:
        sb.emitHelper(node, options, sb.helpers.wrapHeader);
        break;
      case Types.Block:
        sb.emitHelper(node, options, sb.helpers.wrapBlock);
        break;
      default:
        /* istanbul ignore next */
        utils.assertNever(this.type);
    }
  }
}
