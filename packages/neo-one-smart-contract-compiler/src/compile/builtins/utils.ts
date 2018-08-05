import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { BuiltIn } from './types';

// tslint:disable-next-line export-name
export const getMembers = <T extends BuiltIn>(
  sb: ScriptBuilder,
  instanceSymbol: ts.Symbol,
  isMember: (builtin: BuiltIn) => builtin is T,
  isEligible: (builtin: T) => boolean,
  useSymbol = false,
): ReadonlyArray<[string, T]> => {
  let testKey = (key: string) => !key.startsWith('__');
  if (useSymbol) {
    testKey = (key) => key.startsWith('__');
  }

  const mutableMembers: Array<[string, T]> = [];
  tsUtils.symbol.getMembersOrThrow(instanceSymbol).forEach((symbol, key) => {
    const builtin = sb.builtIns.get(symbol);
    const unescapedKey = ts.unescapeLeadingUnderscores(key);
    if (builtin !== undefined && isMember(builtin) && testKey(unescapedKey) && isEligible(builtin)) {
      mutableMembers.push([unescapedKey, builtin]);
    }
  });

  return mutableMembers;
};
