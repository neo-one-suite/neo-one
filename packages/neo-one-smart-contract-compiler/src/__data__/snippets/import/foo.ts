export type Address = string;
export const foo = 'foo';

export abstract class SmartContract {
  public get foo(): string {
    return 'foo';
  }
}
