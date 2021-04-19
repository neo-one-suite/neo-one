import { Builtins } from '../../Builtins';
import { add as addABI } from './abi';
import { add as addEvent } from './event';
import { add as addGroup } from './group';
import { add as addManifest } from './manifest';
import { add as addMethod } from './method';
import { add as addParameter } from './parameter';
import { add as addParameterType } from './parameterType';
import { add as addPermission } from './permission';

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  addABI(builtins);
  addEvent(builtins);
  addGroup(builtins);
  addMethod(builtins);
  addParameter(builtins);
  addPermission(builtins);
  addManifest(builtins);
  addParameterType(builtins);
};
