import { scan } from '@neo-one/smart-contract-compiler';
import _ from 'lodash';
import { ProjectConfig } from '../types';

export interface Contract {
  readonly filePath: string;
  readonly contractName: string;
}
export type Contracts = ReadonlyArray<Contract>;

export const findContracts = async (project: ProjectConfig): Promise<Contracts> => {
  const contracts = await scan(project.paths.contracts);

  return _.flatMap(
    Object.entries(contracts).map(([filePath, fileContracts]) =>
      fileContracts.map((contractName) => ({
        filePath,
        contractName,
      })),
    ),
  );
};
