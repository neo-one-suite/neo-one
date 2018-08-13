import { Types } from '../../../constants';
import { Builtins } from '../../Builtins';
import { SysCallValue } from '../SysCallValue';
import { CreateOrMigrateCall } from './CreateOrMigrateCall';
import { Destroy } from './destroy';
import { DoReturn } from './doReturn';
import { GetArgument } from './getArgument';
import { GetStorage } from './getStorage';
import { PutStorage } from './putStorage';

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInternalValue('doReturn', new DoReturn());
  builtins.addInternalValue('getArgument', new GetArgument());
  builtins.addInternalValue('create', new CreateOrMigrateCall('Neo.Contract.Create'));
  builtins.addInternalValue('migrate', new CreateOrMigrateCall('Neo.Contract.Migrate'));
  builtins.addInternalValue('destroy', new Destroy());
  builtins.addInternalValue('getStorage', new GetStorage());
  builtins.addInternalValue('putStorage', new PutStorage());
  builtins.addInternalValue('trigger', new SysCallValue('Neo.Runtime.GetTrigger', Types.Number));
};
