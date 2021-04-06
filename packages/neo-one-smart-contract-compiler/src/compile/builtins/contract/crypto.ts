import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Types, WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInterface } from '../BuiltinInterface';
import { BuiltinMemberCall } from '../BuiltinMemberCall';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';
import { MemberLikeExpression } from '../types';

class CryptoInterface extends BuiltinInterface {}
class CryptoValue extends BuiltinValueObject {
  public readonly type = 'CryptoConstructor';
}

type hashSysCall = 'RIPEMD160' | 'SHA256';

class HashSysCall extends BuiltinMemberCall {
  public constructor(private readonly firstHash: hashSysCall, private readonly secondHash?: hashSysCall) {
    super();
  }
  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    const args = tsUtils.argumented.getArguments(node);
    if (args.length === 0) {
      return;
    }

    const arg = args[0];

    const throwTypeError = (innerOptions: VisitOptions) => {
      sb.emitOp(arg, 'DROP');
      sb.emitHelper(arg, innerOptions, sb.helpers.throwTypeError);
    };

    const unwrap = (type: WrappableType) => (innerOptions: VisitOptions) => {
      // [value]
      sb.emitHelper(arg, innerOptions, sb.helpers.unwrapVal({ type }));
    };
    // [val]
    sb.visit(arg, options);
    // [value]
    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: sb.context.analysis.getType(arg),
        array: throwTypeError,
        map: throwTypeError,
        set: throwTypeError,
        boolean: unwrap(Types.Boolean),
        buffer: unwrap(Types.Buffer),
        null: throwTypeError,
        number: unwrap(Types.Number),
        object: throwTypeError,
        string: unwrap(Types.String),
        symbol: throwTypeError,
        undefined: throwTypeError,
        arrayStorage: throwTypeError,
        mapStorage: throwTypeError,
        setStorage: throwTypeError,
        error: throwTypeError,
        forwardValue: throwTypeError,
        iteratorResult: throwTypeError,
        iterable: throwTypeError,
        iterableIterator: throwTypeError,
        transaction: throwTypeError,
        attribute: throwTypeError,
        contract: throwTypeError,
        block: throwTypeError,
      }),
    );
    // [buffer]
    sb.emitHelper(node, options, sb.helpers[this.firstHash]);
    if (this.secondHash !== undefined) {
      sb.emitHelper(node, options, sb.helpers[this.secondHash]);
    }
    // [val]
    sb.emitHelper(node, optionsIn, sb.helpers.wrapBuffer);
  }
}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('CryptoConstructor', new CryptoInterface());
  builtins.addContractMember('CryptoConstructor', 'ripemd160', new HashSysCall('RIPEMD160'));
  builtins.addContractMember('CryptoConstructor', 'sha256', new HashSysCall('SHA256'));
  builtins.addContractMember('CryptoConstructor', 'hash160', new HashSysCall('SHA256', 'RIPEMD160'));
  builtins.addContractMember('CryptoConstructor', 'hash256', new HashSysCall('SHA256', 'SHA256'));
  builtins.addContractValue('crypto', new CryptoValue());
};
