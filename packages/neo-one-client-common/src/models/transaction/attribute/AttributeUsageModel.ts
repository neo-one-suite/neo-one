import { InvalidAttributeUsageError, InvalidAttributeUsageJSONError } from '../../../errors';
import { AttributeUsageJSON } from '../../types';

export enum AttributeUsageModel {
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

const isAttributeUsage = (value: number): value is AttributeUsageModel =>
  // tslint:disable-next-line strict-type-predicates
  AttributeUsageModel[value] !== undefined;

export const assertAttributeUsage = (value: number): AttributeUsageModel => {
  if (isAttributeUsage(value)) {
    return value;
  }

  throw new InvalidAttributeUsageError(value);
};

export const toJSONAttributeUsage = (usage: AttributeUsageModel): AttributeUsageJSON =>
  assertAttributeUsageJSON(AttributeUsageModel[usage]);

export const isAttributeUsageJSON = (usage: string): usage is AttributeUsageJSON =>
  // tslint:disable-next-line strict-type-predicates no-any
  AttributeUsageModel[usage as any] !== undefined;

export const assertAttributeUsageJSON = (usage: string): AttributeUsageJSON => {
  if (isAttributeUsageJSON(usage)) {
    return usage;
  }

  throw new InvalidAttributeUsageJSONError(usage);
};

export const toAttributeUsage = (usage: AttributeUsageJSON): AttributeUsageModel =>
  assertAttributeUsage(AttributeUsageModel[usage]);
