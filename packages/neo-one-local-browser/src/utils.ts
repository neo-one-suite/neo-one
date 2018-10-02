export const getSmartContractBasePath = (value: string) => `node_modules/@neo-one/smart-contract/${value}`;
export const getSmartContractLibBasePath = (value: string) => `node_modules/@neo-one/smart-contract-lib/${value}`;
export const getSmartContractPath = (value: string) => getSmartContractBasePath(`src/${value}`);
export const getSmartContractLibPath = (value: string) => getSmartContractLibBasePath(`src/${value}`);
export const CONTRACTS_PATH = 'one/contracts';
export const getContractsPath = (value: string) => `${CONTRACTS_PATH}/${value}`;
