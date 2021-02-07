// tslint:disable no-object-mutation
import { Configuration, rpcURL } from '@neo-one/cli-common';
import { Contracts } from '@neo-one/smart-contract-compiler';
import Listr from 'listr';
import _ from 'lodash';
import { Command } from '../types';
import { findContracts } from './../build/findContracts';
import { generateCode } from './../build/generateCode';
import { generateCommonCode } from './../build/generateCommonCode';
import { compileContract } from './../compile/compileContract';

export const createTasks = (_cmd: Command, config: Configuration) =>
  new Listr([
    {
      title: 'Find contracts',
      task: async (ctx) => {
        const contracts = await findContracts(config);
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
              const {
                linked,
                sourceMaps,
                contract: {
                  contract: { manifest },
                },
                address,
                sourceMap,
              } = await compileContract(contract.filePath, contract.name, innerCtx.linked, innerCtx.sourceMaps);
              innerCtx.linked = linked;
              innerCtx.sourceMaps = sourceMaps;
              innerCtx.contracts.push({
                name: contract.name,
                filePath: contract.filePath,
                sourceMap,
              });

              const networksDefinition = {};

              await generateCode(
                config,
                contract.filePath,
                contract.name,
                manifest,
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
        // TODO: add more network definition here for non-local dev purposes?
        // should these new definitions be in build createTasks
        const networks = [
          {
            name: 'local',
            rpcURL: `http://localhost:${config.network.port}/rpc`,
            dev: true,
          },
          {
            name: 'test',
            rpcURL: rpcURL.test,
            dev: false,
          },
          {
            name: 'main',
            rpcURL: rpcURL.main,
            dev: false,
          },
        ];
        await generateCommonCode(config, ctx.contracts, networks, ctx.sourceMaps);
      },
    },
  ]);
