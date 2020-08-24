import { makeErrorWithCode } from '@neo-one/utils';

// tslint:disable-next-line export-name
export const InvalidContractFeatureError = makeErrorWithCode(
  'INVALID_CONTRACT_PROPERTY_STATE',
  (contractParameterFeature: number) => `Expected contract feature, found: ${contractParameterFeature.toString(16)}`,
);
export const InvalidVersionError = makeErrorWithCode(
  'INVALID_VERSION',
  (expected: number, value: number) => `Expected version to be ${expected}, found: ${value}`,
);
