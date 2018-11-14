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
  name: '',
  codeVersion: '1.0',
  author: '',
  email: '',
  description: '',
};

export enum Decorator {
  constant = 'constant',
  send = 'send',
  sendUnsafe = 'sendUnsafe',
  receive = 'receive',
  claim = 'claim',
}

// tslint:disable-next-line no-any
export const isDecorator = (value: string): value is Decorator => (Decorator as any)[value] !== undefined;

export const DECORATORS: Set<Decorator> = new Set(Object.values(Decorator));
export const DECORATORS_ARRAY = Object.values(Decorator);

export enum ContractPropertyName {
  deploy = 'deploy',
  processedTransactions = 'processedTransactions',
  claimedTransactions = 'claimedTransactions',
  address = 'address',
  properties = 'properties',
  refundAssets = 'refundAssets',
  completeSend = 'completeSend',
  deployed = 'deployed',
  approveUpgrade = 'approveUpgrade',
  upgrade = 'upgrade',
  destroy = 'destroy',
}

export const VIRTUAL_PROPERTIES: Set<string> = new Set([ContractPropertyName.deploy]);
export const RESERVED_PROPERTIES: Set<string> = new Set([
  ContractPropertyName.refundAssets,
  ContractPropertyName.completeSend,
  ContractPropertyName.upgrade,
  ContractPropertyName.destroy,
]);
export const BUILTIN_PROPERTIES: Set<string> = new Set([
  ContractPropertyName.processedTransactions,
  ContractPropertyName.claimedTransactions,
  ContractPropertyName.address,
  ContractPropertyName.deployed,
]);
export const IGNORED_PROPERTIES: Set<string> = new Set([ContractPropertyName.properties]);
