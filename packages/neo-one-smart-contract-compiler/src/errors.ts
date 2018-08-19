import { makeErrorWithCode } from '@neo-one/utils';

// tslint:disable-next-line export-name
export const MultipleContractsInFileError = makeErrorWithCode(
  'MULTIPLE_CONTRACTS_IN_FILE',
  (filePath: string) => `Only one contract is allowed per file: ${filePath}`,
);

export const CircularLinkedDependencyError = makeErrorWithCode(
  'CIRCULAR_LINKED_DEPENDENCY',
  () => 'Linked smart contracts have a circular dependency.',
);
