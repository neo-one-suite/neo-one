// tslint:disable no-object-mutation
import { Contracts } from '@neo-one/smart-contract-compiler';
import Listr from 'listr';
import { compileContract } from './compileContract';
import { findContracts } from './findContracts';
import { writeContract } from './writeContract';

export const createTasks = (path: string, outDir: string) =>
  new Listr([
    {
      title: 'Find Contracts',
      task: async (ctx) => {
        const contracts = await findContracts(path);

        ctx.foundContracts = contracts;
      },
    },
    {
      title: 'Compile Contracts',
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

              await writeContract(result, outDir);

              innerCtx.linked = linked;
              innerCtx.sourceMaps = sourceMaps;
            },
          })),
        );
      },
    },
  ]);
