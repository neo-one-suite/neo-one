import { InvalidAttributeTypeError, InvalidAttributeTypeJSONError } from '../../../errors';
import { AttributeTypeJSON } from '../../types';

export enum AttributeTypeModel {
  HighPriority = 0x01,
  OracleResponse = 0x11,
}

const isAttributeType = (value: number): value is AttributeTypeModel =>
  // tslint:disable-next-line strict-type-predicates
  AttributeTypeModel[value] !== undefined;

export const assertAttributeType = (value: number): AttributeTypeModel => {
  if (isAttributeType(value)) {
    return value;
  }

  throw new InvalidAttributeTypeError(value);
};

export const toJSONAttributeType = (type: AttributeTypeModel): AttributeTypeJSON =>
  assertAttributeTypeJSON(AttributeTypeModel[type]);

export const isAttributeTypeJSON = (type: string): type is AttributeTypeJSON =>
  // tslint:disable-next-line strict-type-predicates no-any
  AttributeTypeModel[type as any] !== undefined;

export const assertAttributeTypeJSON = (type: string): AttributeTypeJSON => {
  if (isAttributeTypeJSON(type)) {
    return type;
  }

  throw new InvalidAttributeTypeJSONError(type);
};

export const toAttributeType = (type: AttributeTypeJSON): AttributeTypeModel =>
  assertAttributeType(AttributeTypeModel[type]);
