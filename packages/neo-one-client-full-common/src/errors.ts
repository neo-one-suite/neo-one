import { makeErrorWithCode } from '@neo-one/utils';

// tslint:disable-next-line export-name
export const InvalidContractPropertyStateError = makeErrorWithCode(
  'INVALID_CONTRACT_PROPERTY_STATE',
  (contractParameterType: number) => `Expected contract parameter type, found: ${contractParameterType.toString(16)}`,
);
