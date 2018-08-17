export type Address = string;
export const foo = 'foo';

export abstract class SmartContract {
  public get foo(): string {
    return 'foo';
  }
}

// tslint:disable-next-line no-default-export
export default class FooSmartContract extends SmartContract {}
