import { InvalidFormatError } from '../common';

export enum TriggerType {
  OnPersist = 0x01,
  PostPersist = 0x02,
  Verification = 0x20,
  Application = 0x40,
  // tslint:disable-next-line: no-bitwise
  System = OnPersist | PostPersist,
  // tslint:disable-next-line: no-bitwise
  All = OnPersist | PostPersist | Verification | Application,
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
