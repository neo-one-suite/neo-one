import { Contracts, scan } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';
import { ProjectConfig } from '../types';

export const findContracts = async (project: ProjectConfig): Promise<Contracts> =>
  scan(project.paths.contracts, createCompilerHost());
