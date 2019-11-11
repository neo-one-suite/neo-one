export const getSmartContractBasePath = (value: string) => `/node_modules/@neo-one/smart-contract/${value}`;
export const getSmartContractLibBasePath = (value: string) => `/node_modules/@neo-one/smart-contract-lib/${value}`;
export const getSmartContractPath = (value: string) => getSmartContractBasePath(`lib/${value}`);
export const getSmartContractLibPath = (value: string) => getSmartContractLibBasePath(`lib/${value}`);
export const CONTRACTS_PATH = '/one/contracts';
