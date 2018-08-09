import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

export interface InObjectPropertyHelperOptions {
  readonly propType: ts.Type | undefined;
}

// Input: [propVal, objectVal]
// Output: [boolean]
export class InObjectPropertyHelper extends Helper {
  public readonly propType: ts.Type | undefined;

  public constructor({ propType }: InObjectPropertyHelperOptions) {
    super();
    this.propType = propType;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      // [objectVal]
      sb.emitOp(node, 'DROP');
      // []
      sb.emitOp(node, 'DROP');

      return;
    }

    const handleSymbol = () => {
      // [string, objectVal]
      sb.emitHelper(node, options, sb.helpers.unwrapSymbol);
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.inSymbolObjectProperty);
    };

    const handleString = () => {
      // [string, objectVal]
      sb.emitHelper(node, options, sb.helpers.toString({ type: this.propType }));
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.inPropertyObjectProperty);
    };

    if (
      this.propType === undefined ||
      (tsUtils.type_.hasSymbolish(this.propType) && !tsUtils.type_.isOnlySymbolish(this.propType))
    ) {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [propVal, propVal, objectVal]
            sb.emitOp(node, 'DUP');
            // [boolean, propVal, objectVal]
            sb.emitHelper(node, options, sb.helpers.isSymbol);
          },
          whenTrue: () => {
            handleSymbol();
          },
          whenFalse: () => {
            handleString();
          },
        }),
      );
    } else if (tsUtils.type_.isOnlySymbolish(this.propType)) {
      handleSymbol();
    } else {
      handleString();
    }
  }
}
