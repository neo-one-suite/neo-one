import { ABIParameter, ABIReturn } from '@neo-one/client-core';
import { utils } from '@neo-one/utils';

export const toTypeScriptType = (abi: ABIReturn | ABIParameter, includeOptional = true): string => {
  const addOptional = (value: string) => (includeOptional && abi.optional ? `${value} | undefined` : value);
  switch (abi.type) {
    case 'Signature':
      return addOptional('SignatureString');
    case 'Boolean':
      return addOptional('boolean');
    case 'Hash160':
      return addOptional('Hash160String');
    case 'Hash256':
      return addOptional('Hash256String');
    case 'ByteArray':
      return addOptional('BufferString');
    case 'PublicKey':
      return addOptional('PublicKeyString');
    case 'String':
      return addOptional('string');
    case 'Array':
      return addOptional(`Array<${toTypeScriptType(abi.value)}>`);
    case 'InteropInterface':
      return 'undefined';
    case 'Void':
      return 'undefined';
    case 'Integer':
      return addOptional('number');
    default:
      utils.assertNever(abi);
      throw new Error('Something went wrong');
  }
};
