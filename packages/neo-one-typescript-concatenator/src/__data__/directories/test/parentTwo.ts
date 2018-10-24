import { ChildClass } from './childOne';
import { childEnum, getEnumValue } from './childTwo';

export const parentEnum = childEnum;

export type parentType = Buffer | string;

export class ParentTwoClass extends ChildClass {
  public static readonly enumValue = getEnumValue;
  public constructor() {
    super();
  }

  public parentFunc() {
    return this.childFunc();
  }
}
