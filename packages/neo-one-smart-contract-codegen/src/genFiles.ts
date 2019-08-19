import { ABI, SmartContractNetworksDefinition } from '@neo-one/client-common';
import { genABI } from './abi';
import { genContract } from './contract';
import { formatFile } from './formatFile';
import { FileResult } from './type';
import { genSmartContractTypes } from './types';

export interface FilesResult {
  readonly abi: FileResult;
  readonly contract: FileResult;
  readonly types: FileResult;
}

export const genFiles = ({
  name,
  networksDefinition,
  sourceMapsPath,
  createContractPath,
  typesPath,
  abiPath,
  abi,
  browserify,
}: {
  readonly name: string;
  readonly networksDefinition: SmartContractNetworksDefinition;
  readonly sourceMapsPath: string;
  readonly createContractPath: string;
  readonly typesPath: string;
  readonly abiPath: string;
  readonly contractPath: string;
  readonly abi: ABI;
  readonly browserify: boolean;
}) => {
  const abiFile = formatFile(genABI(name, abi), browserify);
  const contractFile = formatFile(
    genContract({
      name,
      createContractPath,
      sourceMapsPath,
      typesPath,
      abiPath,
      networksDefinition,
    }),
    browserify,
  );
  const typesFile = formatFile(genSmartContractTypes(name, abi), browserify);

  return {
    abi: abiFile,
    contract: contractFile,
    types: typesFile,
  };
};
