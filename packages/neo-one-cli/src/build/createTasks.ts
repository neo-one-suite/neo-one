// tslint:disable no-object-mutation
import { Configuration } from '@neo-one/client-common';
import { Contracts } from '@neo-one/smart-contract-compiler';
import Listr from 'listr';
import { Command } from '../types';
import { deployContract } from './deployContract';
import { findContracts } from './findContracts';
import { generateCode } from './generateCode';
import { generateCommonCode } from './generateCommonCode';
import { setupWallets } from './setupWallets';
import { startNetwork } from './startNetwork';

export const createTasks = (cmd: Command, config: Configuration, reset: boolean) =>
  new Listr([
    {
      title: 'Start development network',
      task: async (ctx) => {
        const [contracts] = await Promise.all([findContracts(config), startNetwork(cmd, config, reset)]);
        ctx.foundContracts = contracts;
      },
    },
    {
      title: 'Setup wallets',
      task: async () => {
        await setupWallets(config);
      },
    },
    {
      title: 'Deploy',
      task: (ctx) => {
        ctx.linked = {};
        ctx.sourceMaps = {};
        ctx.contracts = [];

        return new Listr(
          (ctx.foundContracts as Contracts).map((contract) => ({
            title: `Deploy ${contract.name}`,
            task: async (innerCtx) => {
              const { linked, sourceMaps, abi, address, sourceMap } = await deployContract(
                config,
                contract.filePath,
                contract.name,
                innerCtx.linked,
                innerCtx.sourceMaps,
              );
              innerCtx.linked = linked;
              innerCtx.sourceMaps = sourceMaps;
              innerCtx.contracts.push({
                name: contract.name,
                filePath: contract.filePath,
                sourceMap,
              });

              await generateCode(config, contract.filePath, contract.name, abi, {
                local: {
                  address,
                },
              });
            },
          })),
        );
      },
    },
    {
      title: 'Generate common code',
      task: async (ctx) => {
        const networks = [
          {
            name: 'local',
            rpcURL: `http://localhost:${config.network.port}/rpc`,
            dev: true,
          },
        ];
        await generateCommonCode(config, ctx.contracts, networks, ctx.sourceMaps);
      },
    },
  ]);
