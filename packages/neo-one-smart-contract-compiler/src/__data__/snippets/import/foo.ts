export type Address = string;
export const foo = 'foo';

export abstract class SmartContract {
  get foo(): string {
    return 'foo';
  }
}
