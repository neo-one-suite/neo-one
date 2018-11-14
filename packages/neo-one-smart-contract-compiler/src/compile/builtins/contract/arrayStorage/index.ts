import ts from 'typescript';
import { Types } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceOf } from '../../BuiltinInstanceOf';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { StorageFor, StorageForEach } from '../storage';
import { ArrayStorageIterator } from './iterator';
import { ArrayStorageLength } from './length';
import { ArrayStoragePop } from './pop';
import { ArrayStoragePush } from './push';

class ArrayStorageInterface extends BuiltinInterface {}
class ArrayStorageValue extends BuiltinInstanceOf {
  public readonly type = 'ArrayStorageConstructor';

  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.visit(node, options);
    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.isArrayStorage);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');
    }
  }
}
class ArrayStorageConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('ArrayStorage', new ArrayStorageInterface());
  builtins.addContractValue('ArrayStorage', new ArrayStorageValue());
  builtins.addContractMember('ArrayStorage', '__@iterator', new ArrayStorageIterator());
  builtins.addContractMember('ArrayStorage', 'forEach', new StorageForEach(Types.ArrayStorage));
  builtins.addContractMember('ArrayStorage', 'length', new ArrayStorageLength());
  builtins.addContractMember('ArrayStorage', 'push', new ArrayStoragePush());
  builtins.addContractMember('ArrayStorage', 'pop', new ArrayStoragePop());
  builtins.addContractInterface('ArrayStorageConstructor', new ArrayStorageConstructorInterface());
  builtins.addContractMember('ArrayStorageConstructor', 'for', new StorageFor(Types.ArrayStorage));
};
