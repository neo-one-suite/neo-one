import { getReadSmartContractName } from '../types';

export const getCreateReadSmartContractName = (name: string) => `create${getReadSmartContractName(name)}`;
