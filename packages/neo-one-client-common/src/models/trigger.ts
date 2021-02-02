import { InvalidFormatError } from '../common';

export enum TriggerType {
  System = 0x01,
  Verification = 0x20,
  Application = 0x40,
}

export type TriggerTypeJSON = keyof typeof TriggerType;

// tslint:disable-next-line: strict-type-predicates no-any
export const isTriggerTypeJSON = (type: string): type is TriggerTypeJSON => TriggerType[type as any] !== undefined;

export const assertTriggerTypeJSON = (type: string): TriggerTypeJSON => {
  if (isTriggerTypeJSON(type)) {
    return type;
  }

  throw new InvalidFormatError();
};

export const toTriggerTypeJSON = (type: TriggerType) => assertTriggerTypeJSON(TriggerType[type]);

// tslint:disable-next-line: strict-type-predicates
export const isTriggerType = (type: number): type is TriggerType => TriggerType[type] !== undefined;

export const assertTriggerType = (type: number): TriggerType => {
  if (isTriggerType(type)) {
    return type;
  }

  throw new InvalidFormatError();
};

export const triggerTypeFromJSON = (json: TriggerTypeJSON) => assertTriggerType(TriggerType[json]);
