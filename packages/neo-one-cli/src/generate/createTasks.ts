// tslint:disable no-object-mutation
import { Configuration } from '@neo-one/cli-common';
import { scriptHashToAddress } from '@neo-one/client';
import { common, crypto } from '@neo-one/client-common';
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
                contract: { abi, contract: contractCompiled },
                sourceMap,
              } = await compileContract(contract.filePath, contract.name, innerCtx.linked, innerCtx.sourceMaps);
              innerCtx.linked = linked;
              innerCtx.sourceMaps = sourceMaps;
              innerCtx.contracts.push({
                name: contract.name,
                filePath: contract.filePath,
                sourceMap,
              });

              const address = scriptHashToAddress(
                common.uInt160ToString(crypto.toScriptHash(Buffer.from(contractCompiled.script, 'hex'))),
              );

              const networksDefinition = {};

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
  ]);
