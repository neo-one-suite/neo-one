// tslint:disable
import { setupContractTest, SetupTestResult } from '@neo-one/smart-contract-compiler';
import * as path from 'path';
import { ICOSmartContract } from './types';

export const setupICOTest = async (): Promise<SetupTestResult<ICOSmartContract>> =>
  setupContractTest<ICOSmartContract>(path.resolve(__dirname, '../../contracts/ICO.ts'), 'ICO');
