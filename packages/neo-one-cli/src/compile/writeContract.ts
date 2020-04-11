import { CompileContractResult } from '@neo-one/smart-contract-compiler';
import fs from 'fs-extra';
import path from 'path';

export const writeContract = async (contract: CompileContractResult, outDir: string) => {
  await fs.ensureDir(outDir);
  const outputPath = path.resolve(outDir, `${contract.contract.name}.contract.json`);

  const contractJSON = JSON.stringify(contract, undefined, 2);

  return fs.writeFile(outputPath, contractJSON);
};
