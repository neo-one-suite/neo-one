import { scan } from './scan';

export interface FindContractResult {
  filePath: string;
  name: string;
}

export const findContract = async (
  dir: string,
  name: string,
): Promise<FindContractResult> => {
  const contracts = await scan(dir);
  const found = Object.entries(contracts)
    .map(([path, contractNames]) => ({
      path,
      contractNames: contractNames.filter(
        (contractName) => name === contractName,
      ),
    }))
    .filter(({ contractNames }) => contractNames.length > 0);
  if (found.length > 1) {
    throw new Error(`Found multiple contracts with name ${name}`);
  } else if (found.length === 0) {
    throw new Error(`Cound not find contract with name ${name}`);
  }

  return {
    filePath: found[0].path,
    name,
  };
};
