import { ABIParameter, ABIReturn } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';

export interface Options {
  readonly isParameter: boolean;
  readonly includeOptional?: boolean;
  readonly migration?: boolean;
}

export const toTypeScriptType = (
  abi: ABIReturn | ABIParameter,
  { isParameter, includeOptional = true, migration = false }: Options,
): string => {
  const addOptional = (value: string) => (includeOptional && abi.optional ? `${value} | undefined` : value);
  const addMigration = (value: string) => (migration ? `(${value} | Promise<${value}>)` : value);
  const addOptions = (value: string) => addMigration(addOptional(value));
  switch (abi.type) {
    case 'Signature':
      return addOptions('SignatureString');
    case 'Boolean':
      return addOptions('boolean');
    case 'Address':
    case 'Hash160':
      return addOptions('AddressString');
    case 'Hash256':
      return addOptions('Hash256String');
    case 'Buffer':
      return addOptions('BufferString');
    case 'PublicKey':
      return addOptions('PublicKeyString');
    case 'String':
      return addOptions('string');
    case 'Array':
      return addOptions(`Array<${toTypeScriptType(abi.value, { isParameter })}>`);
    case 'Map':
      return addOptions(
        `Map<${toTypeScriptType(abi.key, { isParameter })}, ${toTypeScriptType(abi.value, { isParameter })}>`,
      );
    case 'Object':
      return addOptions(`{
      ${Object.entries(abi.properties)
        .reduce<ReadonlyArray<string>>(
          (acc, [key, val]) => acc.concat([`readonly '${key}': ${toTypeScriptType(val, { isParameter })}`]),
          [],
        )
        .join('\n')}
    }`);
    case 'Any':
      return 'any';
    case 'Void':
      return 'undefined';
    case 'Integer':
      return addOptions('BigNumber');
    case 'ForwardValue':
      return isParameter ? addOptions('ForwardValue') : addOptions('ContractParameter');
    default:
      utils.assertNever(abi);
      throw new Error('Something went wrong');
  }
};
