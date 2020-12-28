/// <reference types="@neo-one/build-tools/types/e2e" />

import {
  common,
  Contract,
  crypto,
  InvocationResult,
  RawInvokeReceipt,
  scriptHashToAddress,
  SmartContractDefinition,
  SourceMaps,
  UserAccountID,
  Transaction,
  ContractABI,
} from '@neo-one/client-common';
import { DeveloperClient, LocalKeyStore, LocalWallet, NEOONEDataProvider, SmartContract } from '@neo-one/client-core';
import { Client, InvokeExecuteTransactionOptions, ReadClient } from '@neo-one/client-full-core';
import { createCompilerHost, pathResolve } from '@neo-one/smart-contract-compiler-node';
import { tsUtils } from '@neo-one/ts-utils';
import { Modifiable } from '@neo-one/utils';
import * as appRootDir from 'app-root-dir';
import BigNumber from 'bignumber.js';
import ts from 'typescript';
import { compile } from '../../compile';
import { CompileResult, LinkedContracts } from '../../compile/types';
import { Context } from '../../Context';
import { createNode } from '@neo-one/smart-contract-test';
import { createContextForPath, createContextForSnippet } from '../../createContext';
import { throwOnDiagnosticErrorOrWarning } from '../../utils';
import { checkRawResult } from './extractors';
import { getClients } from './getClients';

export interface Result {
  readonly networkName: string;
  readonly client: Client;
  readonly keystore: LocalKeyStore;
  readonly developerClient: DeveloperClient;
  readonly smartContract: SmartContract;
  readonly masterAccountID: UserAccountID;
  readonly masterPrivateKey: string;
}

interface AddContractOptions {
  readonly fileName?: string;
}

export interface TestNode {
  readonly addContract: (script: string, options?: AddContractOptions) => Promise<Contract>;
  readonly addContractWithDefinition: (
    script: string,
    options?: AddContractOptions,
  ) => Promise<{ readonly contract: Contract; readonly definition: SmartContractDefinition }>;
  readonly addContractFromSnippet: (snippetPath: string, linked?: LinkedContracts) => Promise<Contract>;
  // tslint:disable-next-line no-any
  readonly executeString: (
    script: string,
    options?: InvokeExecuteTransactionOptions,
  ) => Promise<{
    readonly receipt: RawInvokeReceipt;
    readonly transaction: Transaction;
    readonly sourceMaps: SourceMaps;
  }>;
  readonly compileScript: (script: string) => CompileResult;
  readonly masterWallet: LocalWallet;
  readonly client: Client;
  readonly readClient: ReadClient;
  readonly developerClient: DeveloperClient;
  readonly sourceMaps: SourceMaps;
}

export interface Options {
  readonly script: Buffer;
  readonly abi: ContractABI;
  readonly diagnostics: ReadonlyArray<ts.Diagnostic>;
  readonly ignoreWarnings?: boolean;
}

export interface StartNodeOptions {
  readonly ignoreWarnings?: boolean;
}

// execute string
export interface InvokeValidateResultOptions {
  readonly result: InvocationResult<Contract>;
  readonly developerClient: DeveloperClient;
}

const getCompiledScript = (script: string, fileName?: string): CompileResult => {
  const { context, sourceFile } = createContextForSnippet(script, createCompilerHost(), {
    fileName,
    withTestHarness: true,
  });

  return compile({ context, sourceFile });
};

const publish = async (
  client: Client,
  developerClient: DeveloperClient,
  context: Context,
  code: string,
  ignoreWarnings?: boolean,
): Promise<Contract> => {
  throwOnDiagnosticErrorOrWarning(context.diagnostics, ignoreWarnings);

  const result = await client.publish({
    script: code,
    parameters: ['String', 'Array'],
    returnType: 'Buffer',
    name: 'TestContract',
    codeVersion: '1.0',
    author: 'test',
    email: 'test@test.com',
    description: 'test',
    storage: true,
    dynamicInvoke: true,
    payable: true,
  });

  const [publishReceipt] = await Promise.all([
    result.confirmed({ timeoutMS: 2500 }),
    developerClient.runConsensusNow(),
  ]);
  if (publishReceipt.result.state === 'FAULT') {
    throw new Error(publishReceipt.result.message);
  }

  return publishReceipt.result.value;
};

export const startNode = async (outerOptions: StartNodeOptions = {}): Promise<TestNode> => {
  const { privateKey, rpcURL, node } = await createNode();
  one.addCleanup(async () => node.stop());
  const dataProvider = new NEOONEDataProvider({ network: 'priv', rpcURL });
  const { client, masterWallet, networkName, userAccountProviders } = await getClients({ dataProvider, privateKey });

  const developerClient = new DeveloperClient(dataProvider);
  const mutableSourceMaps: Modifiable<SourceMaps> = {};
  client.hooks.beforeConfirmed.tapPromise('DeveloperClient', async () => {
    await developerClient.runConsensusNow();
  });
  client.hooks.beforeRelay.tapPromise('DeveloperClient', async (options) => {
    options.maxNetworkFee = new BigNumber(-1);
    options.maxSystemFee = new BigNumber(-1);
  });

  return {
    async addContract(script, options = {}): Promise<Contract> {
      const {
        contract: { script: outputScript },
        context,
        sourceMap,
      } = getCompiledScript(script, options.fileName);

      const [result, resolvedSourceMap] = await Promise.all([
        publish(client, developerClient, context, outputScript, outerOptions.ignoreWarnings),
        sourceMap,
      ]);
      mutableSourceMaps[result.hash] = resolvedSourceMap;

      return result;
    },
    async addContractWithDefinition(
      script,
      options = {},
    ): Promise<{ contract: Contract; definition: SmartContractDefinition }> {
      const {
        contract: { script: outputScript },
        context,
        sourceMap,
        abi,
      } = getCompiledScript(script, options.fileName);

      const [result, resolvedSourceMap] = await Promise.all([
        publish(client, developerClient, context, outputScript, outerOptions.ignoreWarnings),
        sourceMap,
      ]);
      mutableSourceMaps[result.hash] = resolvedSourceMap;

      return {
        contract: result,
        definition: createContractDefinition(result, mutableSourceMaps),
      };
    },
    async addContractFromSnippet(snippetPath, linked = {}): Promise<Contract> {
      const filePath = pathResolve(
        appRootDir.get(),
        'packages',
        'neo-one-smart-contract-compiler',
        'src',
        '__data__',
        'snippets',
        snippetPath,
      );
      const context = createContextForPath(filePath, createCompilerHost(), { withTestHarness: true });
      const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, filePath);
      const {
        contract: { script: outputScript },
        sourceMap,
      } = compile({ context, sourceFile, linked });

      const [result, resolvedSourceMap] = await Promise.all([
        publish(client, developerClient, context, outputScript, outerOptions.ignoreWarnings),
        sourceMap,
      ]);
      mutableSourceMaps[result.hash] = resolvedSourceMap;

      return result;
    },
    async executeString(script, options = {}) {
      const {
        contract: { script: outputScript },
        sourceMap,
        context,
      } = getCompiledScript(script);

      throwOnDiagnosticErrorOrWarning(context.diagnostics, outerOptions.ignoreWarnings);

      mutableSourceMaps[
        scriptHashToAddress(common.uInt160ToString(crypto.toScriptHash(Buffer.from(outputScript, 'hex'))))
      ] = await sourceMap;
      const result = await userAccountProviders.memory.__execute(
        outputScript,
        {
          from: masterWallet.userAccount.id,
          maxSystemFee: new BigNumber(-1),
          maxNetworkFee: new BigNumber(-1),
          ...options,
        },
        mutableSourceMaps,
      );

      const [invokeReceipt] = await Promise.all([
        result.confirmed({ timeoutMS: 5000 }),
        developerClient.runConsensusNow(),
      ]);
      await checkRawResult(invokeReceipt, mutableSourceMaps);

      return { receipt: invokeReceipt, transaction: result.transaction, sourceMaps: mutableSourceMaps };
    },
    compileScript: getCompiledScript,
    client,
    readClient: client.read(networkName),
    masterWallet,
    developerClient,
    sourceMaps: mutableSourceMaps,
  };
};
