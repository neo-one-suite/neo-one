import { ABI, SmartContractNetworksDefinition } from '@neo-one/client';
import { genABI } from './abi';
import { genContract } from './contract';
import { formatFile } from './formatFile';
import { genSmartContractTypes } from './types';

export interface FilesResult {
  readonly abi: string;
  readonly contract: string;
  readonly types: string;
}

export const genFiles = ({
  name,
  networksDefinition,
  sourceMapsPath,
  createContractPath,
  typesPath,
  abiPath,
  abi,
}: {
  readonly name: string;
  readonly networksDefinition: SmartContractNetworksDefinition;
  readonly sourceMapsPath: string;
  readonly createContractPath: string;
  readonly typesPath: string;
  readonly abiPath: string;
  readonly contractPath: string;
  readonly abi: ABI;
}) => {
  const abiFile = formatFile(genABI(name, abi));
  const contractFile = formatFile(
    genContract({
      name,
      createContractPath,
      sourceMapsPath,
      typesPath,
      abiPath,
      networksDefinition,
    }),
  );
  const typesFile = formatFile(genSmartContractTypes(name, abi));

  return {
    abi: abiFile,
    contract: contractFile,
    types: typesFile,
  };
};
