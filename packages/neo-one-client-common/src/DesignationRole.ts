import { InvalidFormatError } from './common';
import { InvalidDesignationRoleError } from './errors';

export enum DesignationRole {
  StateValidator = 4,
  Oracle = 8,
  NeoFSAlphabetNode = 16,
}

const isDesignationRole = (value: number): value is DesignationRole =>
  // tslint:disable-next-line strict-type-predicates
  DesignationRole[value] !== undefined;

export const assertDesignationRole = (value: number): DesignationRole => {
  if (isDesignationRole(value)) {
    return value;
  }

  throw new InvalidDesignationRoleError(value);
};

export type DesignationRoleJSON = keyof typeof DesignationRole;

export const isDesignationRoleJSON = (state: string): state is DesignationRoleJSON =>
  // tslint:disable-next-line: strict-type-predicates no-any
  DesignationRole[state as any] !== undefined;

export const assertDesignationRoleJSON = (state: string): DesignationRoleJSON => {
  if (isDesignationRoleJSON(state)) {
    return state;
  }

  throw new InvalidFormatError();
};

export const toDesignationRoleJSON = (state: DesignationRole) => assertDesignationRoleJSON(DesignationRole[state]);
