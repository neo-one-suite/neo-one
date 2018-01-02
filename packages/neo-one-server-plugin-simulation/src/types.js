/* @flow */
import type { ABI } from '@neo-one/client';

export type Language = 'python' | 'csharp';
type ContractConfig = {|
  // Relative file path of the contract to compile. For python contracts, this
  // should be the entry .py file. For csharp contract, this should be the entry
  // .dll file. The compiled contract resource will take the file name without
  // the extension.
  file: string,
  resourceName: string,
  target?: 'compile' | 'deploy',
  // Defaults to file name without extension
  name?: string,
  // Defaults to 1.0.0
  codeVersion?: string,
  // Defaults to empty string
  author?: string,
  // Defaults to empty string
  email?: string,
  // Defaults to empty string
  description?: string,
  // Required if the contract language's compiler cannot automatically infer it.
  properties?: {|
    storage: boolean,
    dynamicInvoke: boolean,
  |},
  // Required if the contract language's compiler cannot automatically infer it.
  abi?: ABI,
|};
type LanguageContractConfig = {|
  // Source directory for the contracts.
  rootDir: string,
  contracts: Array<ContractConfig>,
|};
type WalletConfig = {|
  // How much NEO should we transfer to this Wallet?
  neo?: string,
  // How much GAS should we transfer to this Wallet?
  gas?: string,
  // Create the wallet with a specific private key (WIF format).
  wif?: string,
|};
type HooksConfig = {|
  // Ran before compiling contracts for the simulation.
  // SimulationPreCompileOutputConfig will be located at the config path.
  preCompile?: string,
  // Ran after creating the simulation and the SimulationOutputConfig has been
  // created.
  postCreate?: string,
  // Ran in parallel after starting the simulation. Can be a long-running
  // process whose lifecycle will be managed by neo-one - SIGINT followed by
  // SIGTERM will be passed when neo-one wants to stop the command.
  postStart?: Array<string>,
|};

export type SimulationConfig = {|
  /*
    Contracts are unpacked to
    <cwd>/<targetDir>
  */
  contract?: {
    // Where to unpack the contracts
    targetDir: string,
    // Default language if one is not specified.
    defaultLanguage: Language,
    // Languages supported by this simulation. There must be at least one entry.
    languages: {
      [language: Language]: LanguageContractConfig,
    },
  },
  // Additional wallets to setup.
  wallets?: {|
    // Keys are the name used in neo-one.
    [name: string]: WalletConfig,
  |},
  hooks?: HooksConfig,
  // Relative path to the output root directory where SimulationOutputConfig
  // will be output as a JSON file. Defaults to neo-one.json.
  configPath?: string,
  // Relative path from the simulation package's root directory where the
  // simulation code files are.
  templateDir: string,
  // Additional CLI prompts. Will be output in SimulationOutputConfig#options.
  // All Prompts must have default values. See inquirer.js for prompt format.
  options?: Array<Object>,
  // Set to true if your simulation does not want a network to be automatically
  // created
  skipNetworkCreate?: boolean,
|};

export type SimulationPreCompileOutputConfig = {|
  language: string,
  contractsDir: string,
  contractConfig: LanguageContractConfig,
  options: Object,
|};

export type NetworkOutputConfig = {|
  // Name of the private network in neo-one
  name: string,
  // RPC URL for the private network
  rpcURL: string,
|};

export type WalletOutputConfig = {|
  // Wallet Address
  address: string,
  // Address script hash
  scriptHash: string,
  // Hex public key.
  publicKey: string,
  // WIF format of the private key
  wif: string,
  // Hex private key
  privateKey: string,
|};

export type WalletsOutputConfig = {
  [name: string]: WalletOutputConfig,
};

export type CompiledContractOutputConfig = {|
  abi: ABI,
|};

export type CompiledContractsOutputConfig = {
  // Compiled name
  [name: string]: CompiledContractOutputConfig,
};

export type DeployedContractOutputConfig = {|
  hash: string,
  abi: ABI,
|};

export type DeployedContractsOutputConfig = {
  // Deployed name
  [name: string]: DeployedContractOutputConfig,
};

export type SimulationOutputConfig = {|
  // Created private network. Null if skipNetworkCreate is true
  network?: NetworkOutputConfig,
  // Created wallets. Will always contain a key "master" for the master wallet
  // if a network was created.
  wallets: WalletsOutputConfig,
  // Created contracts
  compiledContracts: CompiledContractsOutputConfig,
  // Deployed contracts.
  deployedContracts: DeployedContractsOutputConfig,
  // Selected language. Null if contract is null or languages is empty
  language?: string,
  // Additional CLI prompt inputs as specified by SimulationConfig#options
  // Contains default values if user chose not to configure.
  options: Object,
|};
