import { ABI } from '@neo-one/client';
export type Language = 'python' | 'csharp';

interface ContractConfig {
  readonly file: string;
  readonly resourceName: string;
  readonly target?: 'compile' | 'deploy';

  readonly name?: string;

  readonly codeVersion?: string;

  readonly author?: string;

  readonly email?: string;

  readonly description?: string;

  readonly properties?: {
    readonly storage: boolean;
    readonly dynamicInvoke: boolean;
    readonly payable: boolean;
  };

  readonly abi?: ABI;
}

export interface LanguageContractConfig {
  readonly rootDir: string;
  readonly contracts: ReadonlyArray<ContractConfig>;
}

interface WalletConfig {
  readonly neo?: string;

  readonly gas?: string;

  readonly wif?: string;
}

interface HooksConfig {
  readonly preCompile?: string;

  readonly postCreate?: string;

  readonly postStart?: ReadonlyArray<string>;
}
export interface SimulationConfig {
  readonly contract?: {
    readonly targetDir: string;

    readonly defaultLanguage: Language;

    readonly languages: {
      readonly [language: string]: LanguageContractConfig;
    };
  };

  readonly wallets?: {
    readonly [name: string]: WalletConfig;
  };

  readonly hooks?: HooksConfig;

  readonly configPath?: string;

  readonly templateDir: string;
  // tslint:disable-next-line no-any
  readonly options?: ReadonlyArray<any>;

  readonly skipNetworkCreate?: boolean;
}
export interface SimulationPreCompileOutputConfig {
  readonly language: string;
  readonly contractsDir: string;
  readonly contractConfig: LanguageContractConfig;
  // tslint:disable-next-line no-any
  readonly options: any;
}
export interface NetworkOutputConfig {
  readonly name: string;

  readonly rpcURL: string;
}
export interface WalletOutputConfig {
  readonly address: string;

  readonly publicKey: string;

  readonly wif: string;

  readonly privateKey: string;
}
export interface WalletsOutputConfig {
  // tslint:disable-next-line readonly-keyword
  [name: string]: WalletOutputConfig;
}
export interface CompiledContractOutputConfig {
  readonly abi: ABI;
}
export interface CompiledContractsOutputConfig {
  // tslint:disable-next-line readonly-keyword
  [name: string]: CompiledContractOutputConfig;
}
export interface DeployedContractOutputConfig {
  readonly hash: string;
  readonly abi: ABI;
}
export interface DeployedContractsOutputConfig {
  // tslint:disable-next-line readonly-keyword
  [name: string]: DeployedContractOutputConfig;
}
export interface SimulationOutputConfig {
  readonly network?: NetworkOutputConfig;

  readonly wallets: WalletsOutputConfig;

  readonly compiledContracts: CompiledContractsOutputConfig;

  readonly deployedContracts: DeployedContractsOutputConfig;

  readonly language?: string;
  // tslint:disable-next-line no-any
  readonly options: any;
}
