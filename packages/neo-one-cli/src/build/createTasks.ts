// tslint:disable no-object-mutation
import { Configuration } from '@neo-one/cli-common';
import { Contracts } from '@neo-one/smart-contract-compiler';
import { camel } from '@neo-one/utils';
import Listr from 'listr';
import _ from 'lodash';
import { loadDeployed } from '../common';
import { Command } from '../types';
import { deployContract } from './deployContract';
import { findContracts } from './findContracts';
import { generateCode } from './generateCode';
import { generateCommonCode } from './generateCommonCode';
import { setupWallets } from './setupWallets';
import { startNeotracker } from './startNeotracker';
import { startNetwork } from './startNetwork';

export const createTasks = (cmd: Command, config: Configuration, reset: boolean) =>
  new Listr([
    {
      title: 'Start development network',
      task: async (ctx) => {
        const [contracts, deployed] = await Promise.all([
          findContracts(config),
          loadDeployed(config),
          startNetwork(cmd, config, reset),
        ]);
        ctx.foundContracts = contracts;
        ctx.deployed = deployed;
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

              const networksDefinition =
                ctx.deployed[camel(contract.name)] === undefined ? {} : ctx.deployed[camel(contract.name)];

              await generateCode(
                config,
                contract.filePath,
                contract.name,
                abi,
                _.merge(
                  {},
                  {
                    local: {
                      address,
                    },
                  },
                  networksDefinition,
                ),
              );
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
    {
      title: 'Start NEO tracker instance',
      task: async (_ctx, task) => {
        if (config.neotracker.skip) {
          task.skip('NEO tracker instance skipped.');
        }
        await startNeotracker(cmd, config, reset);
      },
    },
  ]);
