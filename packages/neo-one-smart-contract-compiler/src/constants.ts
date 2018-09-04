export const MAIN_FUNCTION = 'main';
export const DEPLOY_METHOD = 'deploy';
export const PROPERTIES_PROPERTY = 'properties';
export const NORMAL_COMPLETION = 0;
export const THROW_COMPLETION = 1;
export const BREAK_COMPLETION = 2;
export const CONTINUE_COMPLETION = 3;
export const FINALLY_COMPLETION = 4;

export interface ContractProperties {
  readonly name: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
}

export const DEFAULT_CONTRACT_PROPERTIES = {
  name: 'unknown',
  codeVersion: 'unknown',
  author: 'unknown',
  email: 'unknown',
  description: 'unknown',
};

export enum Decorator {
  constant = 'constant',
  send = 'send',
  receive = 'receive',
  claim = 'claim',
}

// tslint:disable-next-line no-any
export const isDecorator = (value: string): value is Decorator => (Decorator as any)[value] !== undefined;

export const DECORATORS: Set<Decorator> = new Set(Object.values(Decorator));

export enum ContractPropertyName {
  deploy = 'deploy',
  processedTransactions = 'processedTransactions',
  address = 'address',
  properties = 'properties',
}

export const RESERVED_PROPERTIES: Set<string> = new Set([ContractPropertyName.deploy]);
export const BUILTIN_PROPERTIES: Set<string> = new Set([
  ContractPropertyName.processedTransactions,
  ContractPropertyName.address,
]);
export const IGNORED_PROPERTIES: Set<string> = new Set([ContractPropertyName.properties]);
