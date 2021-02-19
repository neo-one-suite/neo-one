// tslint:disable no-object-mutation
import { Contracts } from '@neo-one/smart-contract-compiler';
import Listr from 'listr';
import { compileContract } from './compileContract';
import { findContracts } from './findContracts';
import { CompileWriteOptions, writeContract } from './writeContract';

export const createTasks = (path: string, outDir: string, options: CompileWriteOptions) =>
  new Listr([
    {
      title: 'Find contracts',
      task: async (ctx) => {
        const contracts = await findContracts(path);

        ctx.foundContracts = contracts;
      },
    },
    {
      title: 'Compile contracts',
      task: (ctx) => {
        ctx.linked = {};
        ctx.sourceMaps = {};
        ctx.contracts = [];

        return new Listr(
          (ctx.foundContracts as Contracts).map((contract) => ({
            title: `Compile ${contract.name}`,
            task: async (innerCtx) => {
              const { linked, sourceMaps, contract: result } = await compileContract(
                contract.filePath,
                contract.name,
                innerCtx.linked,
                innerCtx.sourceMaps,
              );

              await writeContract(contract.filePath, result, outDir, options);

              innerCtx.linked = linked;
              innerCtx.sourceMaps = sourceMaps;
            },
          })),
        );
      },
    },
  ]);
