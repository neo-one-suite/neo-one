import { ABI, SmartContractNetworksDefinition } from '@neo-one/client';
import { format } from 'prettier';
import { RawSourceMap } from 'source-map';
import { genABI } from './abi';
import { genContract } from './contract';
import { genTest } from './test';
import { genSmartContractTypes } from './types';

export interface Result {
  readonly abi: string;
  readonly contract: string;
  readonly types: string;
  readonly test: string;
}

const formatFile = (value: string) =>
  `// tslint:disable\n${format(value, {
    arrowParens: 'always',
    parser: 'typescript',
    printWidth: 120,
    singleQuote: true,
    trailingComma: 'all',
  })}`;

export const genFiles = ({
  name,
  networksDefinition,
  sourceMap,
  createContractPath,
  typesPath,
  abiPath,
  contractPath,
  testPath,
  abi,
}: {
  readonly name: string;
  readonly networksDefinition: SmartContractNetworksDefinition;
  readonly sourceMap: RawSourceMap;
  readonly createContractPath: string;
  readonly typesPath: string;
  readonly abiPath: string;
  readonly contractPath: string;
  readonly testPath: string;
  readonly abi: ABI;
}) => {
  const abiFile = formatFile(genABI(name, abi));
  const contractFile = formatFile(
    genContract({
      name,
      createContractPath,
      typesPath,
      abiPath,
      networksDefinition,
      sourceMap,
    }),
  );
  const typesFile = formatFile(genSmartContractTypes(name, abi));
  const testFile = formatFile(
    genTest({
      name,
      contractPath,
      typesPath,
      testPath,
    }),
  );

  return {
    abi: abiFile,
    contract: contractFile,
    types: typesFile,
    test: testFile,
  };
};
