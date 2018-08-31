import ts from 'typescript';
import { Types } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceOf } from '../../BuiltinInstanceOf';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { StorageAt, StorageDelete, StorageFor, StorageHas } from '../storage';
import { SetStorageAdd } from './add';
import { SetStorageForEach } from './forEach';
import { SetStorageIterator } from './iterator';

class SetStorageInterface extends BuiltinInterface {}
class SetStorageValue extends BuiltinInstanceOf {
  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.visit(node, options);
    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.isSetStorage);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');
    }
  }
}
class SetStorageConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('SetStorage', new SetStorageInterface());
  builtins.addContractValue('SetStorage', new SetStorageValue());
  builtins.addContractMember('SetStorage', '__@iterator', new SetStorageIterator());
  builtins.addContractMember('SetStorage', 'forEach', new SetStorageForEach());
  builtins.addContractMember('SetStorage', 'has', new StorageHas(Types.SetStorage));
  builtins.addContractMember('SetStorage', 'delete', new StorageDelete(Types.SetStorage));
  builtins.addContractMember('SetStorage', 'add', new SetStorageAdd());
  builtins.addContractMember('SetStorage', 'at', new StorageAt(Types.SetStorage));
  builtins.addContractInterface('SetStorageConstructor', new SetStorageConstructorInterface());
  builtins.addContractMember('SetStorageConstructor', 'for', new StorageFor(Types.SetStorage));
};
