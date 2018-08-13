import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { Types, WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface UnwrapValHelperOptions {
  readonly type: WrappableType;
}

// Input: [val]
// Output: [value]
export class UnwrapValHelper extends Helper {
  private readonly type: WrappableType;
  public constructor(options: UnwrapValHelperOptions) {
    super();
    this.type = options.type;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    switch (this.type) {
      case Types.Array:
        sb.emitHelper(node, options, sb.helpers.unwrapArray);
        break;
      case Types.Attribute:
        sb.emitHelper(node, options, sb.helpers.unwrapAttribute);
        break;
      case Types.Boolean:
        sb.emitHelper(node, options, sb.helpers.unwrapBoolean);
        break;
      case Types.Buffer:
        sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
        break;
      case Types.Input:
        sb.emitHelper(node, options, sb.helpers.unwrapInput);
        break;
      case Types.Number:
        sb.emitHelper(node, options, sb.helpers.unwrapNumber);
        break;
      case Types.Object:
        sb.emitHelper(node, options, sb.helpers.unwrapObject);
        break;
      case Types.Output:
        sb.emitHelper(node, options, sb.helpers.unwrapOutput);
        break;
      case Types.String:
        sb.emitHelper(node, options, sb.helpers.unwrapString);
        break;
      case Types.Transaction:
        sb.emitHelper(node, options, sb.helpers.unwrapTransaction);
        break;
      case Types.Symbol:
        sb.emitHelper(node, options, sb.helpers.unwrapSymbol);
        break;
      case Types.Account:
        sb.emitHelper(node, options, sb.helpers.unwrapAccount);
        break;
      case Types.Asset:
        sb.emitHelper(node, options, sb.helpers.unwrapAsset);
        break;
      case Types.Contract:
        sb.emitHelper(node, options, sb.helpers.unwrapContract);
        break;
      case Types.Header:
        sb.emitHelper(node, options, sb.helpers.unwrapHeader);
        break;
      case Types.Block:
        sb.emitHelper(node, options, sb.helpers.unwrapBlock);
        break;
      default:
        /* istanbul ignore next */
        utils.assertNever(this.type);
    }
  }
}
