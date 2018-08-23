import { makeErrorWithCode } from '@neo-one/utils';

export enum AttributeUsage {
  ContractHash = 0x00,
  ECDH02 = 0x02,
  ECDH03 = 0x03,
  Script = 0x20,
  Vote = 0x30,
  DescriptionUrl = 0x81,
  Description = 0x90,
  Hash1 = 0xa1,
  Hash2 = 0xa2,
  Hash3 = 0xa3,
  Hash4 = 0xa4,
  Hash5 = 0xa5,
  Hash6 = 0xa6,
  Hash7 = 0xa7,
  Hash8 = 0xa8,
  Hash9 = 0xa9,
  Hash10 = 0xaa,
  Hash11 = 0xab,
  Hash12 = 0xac,
  Hash13 = 0xad,
  Hash14 = 0xae,
  Hash15 = 0xaf,
  Remark = 0xf0,
  Remark1 = 0xf1,
  Remark2 = 0xf2,
  Remark3 = 0xf3,
  Remark4 = 0xf4,
  Remark5 = 0xf5,
  Remark6 = 0xf6,
  Remark7 = 0xf7,
  Remark8 = 0xf8,
  Remark9 = 0xf9,
  Remark10 = 0xfa,
  Remark11 = 0xfb,
  Remark12 = 0xfc,
  Remark13 = 0xfd,
  Remark14 = 0xfe,
  Remark15 = 0xff,
}

export const InvalidAttributeUsageError = makeErrorWithCode(
  'INVALID_ATTRIBUTE_USAGE',
  (transactionAttributeUsage: number) =>
    `Expected transaction attribute usage, ` + `found: ${transactionAttributeUsage.toString(16)}`,
);

const isAttributeUsage = (value: number): value is AttributeUsage =>
  // tslint:disable-next-line strict-type-predicates
  AttributeUsage[value] !== undefined;

export const assertAttributeUsage = (value: number): AttributeUsage => {
  if (isAttributeUsage(value)) {
    return value;
  }

  throw new InvalidAttributeUsageError(value);
};

export const InvalidAttributeUsageJSONError = makeErrorWithCode(
  'INVALID_ATTRIBUTE_USAGE_JSON',
  (transactionAttributeUsage: string) =>
    `Expected transaction attribute usage, ` + `found: ${transactionAttributeUsage}`,
);

export type AttributeUsageJSON = keyof typeof AttributeUsage;

export const toJSONAttributeUsage = (usage: AttributeUsage): AttributeUsageJSON =>
  assertAttributeUsageJSON(AttributeUsage[usage]);

export const isAttributeUsageJSON = (usage: string): usage is AttributeUsageJSON =>
  // tslint:disable-next-line strict-type-predicates no-any
  AttributeUsage[usage as any] !== undefined;

export const assertAttributeUsageJSON = (usage: string): AttributeUsageJSON => {
  if (isAttributeUsageJSON(usage)) {
    return usage;
  }

  throw new InvalidAttributeUsageJSONError(usage);
};

export const toAttributeUsage = (usage: AttributeUsageJSON): AttributeUsage =>
  assertAttributeUsage(AttributeUsage[usage]);
