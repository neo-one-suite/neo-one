import { getSmartContractName } from '../types';

export const getCreateSmartContractName = (name: string) => `create${getSmartContractName(name)}`;
