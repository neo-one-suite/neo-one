import ts from 'typescript';
import { Types } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceOf } from '../../BuiltinInstanceOf';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { StorageAt, StorageDelete, StorageFor, StorageForEach, StorageHas } from '../storage';
import { MapStorageGet } from './get';
import { MapStorageIterator } from './iterator';
import { MapStorageSet } from './set';

class MapStorageInterface extends BuiltinInterface {}
class MapStorageValue extends BuiltinInstanceOf {
  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.visit(node, options);
    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.isMapStorage);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');
    }
  }
}
class MapStorageConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('MapStorage', new MapStorageInterface());
  builtins.addContractValue('MapStorage', new MapStorageValue());
  builtins.addContractMember('MapStorage', '__@iterator', new MapStorageIterator());
  builtins.addContractMember('MapStorage', 'forEach', new StorageForEach(Types.MapStorage));
  builtins.addContractMember('MapStorage', 'get', new MapStorageGet());
  builtins.addContractMember('MapStorage', 'has', new StorageHas(Types.MapStorage));
  builtins.addContractMember('MapStorage', 'delete', new StorageDelete(Types.MapStorage));
  builtins.addContractMember('MapStorage', 'set', new MapStorageSet());
  builtins.addContractMember('MapStorage', 'at', new StorageAt(Types.MapStorage));
  builtins.addContractInterface('MapStorageConstructor', new MapStorageConstructorInterface());
  builtins.addContractMember('MapStorageConstructor', 'for', new StorageFor(Types.MapStorage));
};
