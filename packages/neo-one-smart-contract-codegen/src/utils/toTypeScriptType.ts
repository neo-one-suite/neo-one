import { ABIParameter, ABIReturn } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';

export interface Options {
  readonly isParameter: boolean;
  readonly includeOptional?: boolean;
}

export const toTypeScriptType = (
  abi: ABIReturn | ABIParameter,
  { isParameter, includeOptional = true }: Options,
): string => {
  const addOptional = (value: string) => (includeOptional && abi.optional ? `${value} | undefined` : value);
  switch (abi.type) {
    case 'Signature':
      return addOptional('SignatureString');
    case 'Boolean':
      return addOptional('boolean');
    case 'Address':
      return addOptional('AddressString');
    case 'Hash256':
      return addOptional('Hash256String');
    case 'Buffer':
      return addOptional('BufferString');
    case 'PublicKey':
      return addOptional('PublicKeyString');
    case 'String':
      return addOptional('string');
    case 'Array':
      return addOptional(`Array<${toTypeScriptType(abi.value, { isParameter })}>`);
    case 'Map':
      return addOptional(
        `Map<${toTypeScriptType(abi.key, { isParameter })}, ${toTypeScriptType(abi.value, { isParameter })}>`,
      );
    case 'Object':
      return addOptional(`{
      ${Object.entries(abi.properties)
        .reduce<ReadonlyArray<string>>(
          (acc, [key, val]) => acc.concat([`readonly '${key}': ${toTypeScriptType(val, { isParameter })}`]),
          [],
        )
        .join('\n')}
    }`);
    case 'Void':
      return 'undefined';
    case 'Integer':
      return addOptional('BigNumber');
    case 'ForwardValue':
      return isParameter ? addOptional('ForwardValue') : addOptional('ContractParameter');
    default:
      utils.assertNever(abi);
      throw new Error('Something went wrong');
  }
};
