import { common, crypto, RawInvokeReceipt } from '@neo-one/client-common';
import {
  ABI,
  Client,
  Contract,
  DeveloperClient,
  InvocationResult,
  InvocationTransaction,
  InvokeExecuteTransactionOptions,
  LocalKeyStore,
  LocalWallet,
  ReadClient,
  scriptHashToAddress,
  SmartContract,
  SourceMaps,
  UserAccountID,
} from '@neo-one/client-full';
import { createCompilerHost, pathResolve } from '@neo-one/smart-contract-compiler-node';
import { tsUtils } from '@neo-one/ts-utils';
import * as appRootDir from 'app-root-dir';
import BigNumber from 'bignumber.js';
import ts from 'typescript';
import { setupTestNode } from '../../../../neo-one-smart-contract-test/src/setupTestNode';
import { compile } from '../../compile';
import { CompileResult, LinkedContracts } from '../../compile/types';
import { Context } from '../../Context';
import { createContextForPath, createContextForSnippet } from '../../createContext';
import { throwOnDiagnosticErrorOrWarning } from '../../utils';
import { checkRawResult } from './extractors';

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
  readonly addContractFromSnippet: (snippetPath: string, linked?: LinkedContracts) => Promise<Contract>;
  // tslint:disable-next-line no-any
  readonly executeString: (
    script: string,
    options?: InvokeExecuteTransactionOptions,
  ) => Promise<{
    readonly receipt: RawInvokeReceipt;
    readonly transaction: InvocationTransaction;
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
  readonly abi: ABI;
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
  const { client, masterWallet, provider, networkName, userAccountProviders } = await setupTestNode(false);
  const developerClient = new DeveloperClient(provider.read(networkName));
  const mutableSourceMaps: Modifiable<SourceMaps> = {};
  client.hooks.beforeConfirmed.tapPromise('DeveloperClient', async () => {
    await developerClient.runConsensusNow();
  });
  client.hooks.beforeRelay.tapPromise('DeveloperClient', async (options) => {
    // tslint:disable-next-line no-object-mutation
    options.systemFee = new BigNumber(-1);
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
      mutableSourceMaps[result.address] = resolvedSourceMap;

      return result;
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
      mutableSourceMaps[result.address] = resolvedSourceMap;

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
        { from: masterWallet.account.id, systemFee: new BigNumber(-1), ...options },
        Promise.resolve(mutableSourceMaps),
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
