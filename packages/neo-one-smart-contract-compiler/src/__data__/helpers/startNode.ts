import {
  ABI,
  Client,
  Contract,
  DeveloperClient,
  InvocationResult,
  InvocationTransaction,
  InvokeTransactionOptions,
  LocalKeyStore,
  LocalWallet,
  ReadClient,
  scriptHashToAddress,
  SmartContract,
  SourceMaps,
  UserAccountID,
} from '@neo-one/client';
import { common, crypto, RawInvokeReceipt } from '@neo-one/client-core';
import { tsUtils } from '@neo-one/ts-utils';
import * as appRootDir from 'app-root-dir';
import ts from 'typescript';
import { setupTestNode } from '../../../../neo-one-smart-contract-test/src/setupTestNode';
import { compile } from '../../compile';
import { CompileResult, LinkedContracts } from '../../compile/types';
import { Context } from '../../Context';
import { createContextForPath, createContextForSnippet } from '../../createContext';
import { pathResolve, throwOnDiagnosticErrorOrWarning } from '../../utils';
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

export interface TestNode {
  readonly addContract: (script: string) => Promise<Contract>;
  readonly addContractFromSnippet: (snippetPath: string, linked?: LinkedContracts) => Promise<Contract>;
  // tslint:disable-next-line no-any
  readonly executeString: (
    script: string,
    options?: InvokeTransactionOptions,
  ) => Promise<{ readonly receipt: RawInvokeReceipt; readonly transaction: InvocationTransaction }>;
  readonly compileScript: (script: string) => CompileResult;
  readonly masterWallet: LocalWallet;
  readonly client: Client;
  readonly readClient: ReadClient;
  readonly developerClient: DeveloperClient;
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

const getCompiledScript = (script: string): CompileResult => {
  const { context, sourceFile } = createContextForSnippet(script, { withTestHarness: true });

  return compile({ context, sourceFile });
};

const publish = async (
  client: Client,
  developerClient: DeveloperClient,
  context: Context,
  code: Buffer,
  ignoreWarnings?: boolean,
): Promise<Contract> => {
  throwOnDiagnosticErrorOrWarning(context.diagnostics, ignoreWarnings);

  const result = await client.publish({
    script: code.toString('hex'),
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
  const { client, masterWallet, provider, networkName, userAccountProviders } = await setupTestNode();
  const developerClient = new DeveloperClient(provider.read(networkName));
  const mutableSourceMaps: Modifiable<SourceMaps> = {};

  return {
    async addContract(script): Promise<Contract> {
      const { code, context, sourceMap } = getCompiledScript(script);

      const [result, resolvedSourceMap] = await Promise.all([
        publish(client, developerClient, context, code, outerOptions.ignoreWarnings),
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
      const context = createContextForPath(filePath, { withTestHarness: true });
      const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, filePath);
      const { code, sourceMap } = compile({ context, sourceFile, linked });

      const [result, resolvedSourceMap] = await Promise.all([
        publish(client, developerClient, context, code, outerOptions.ignoreWarnings),
        sourceMap,
      ]);
      mutableSourceMaps[result.address] = resolvedSourceMap;

      return result;
    },
    async executeString(
      script,
      options = {},
    ): Promise<{ readonly receipt: RawInvokeReceipt; readonly transaction: InvocationTransaction }> {
      const { code, sourceMap, context } = getCompiledScript(script);

      throwOnDiagnosticErrorOrWarning(context.diagnostics, outerOptions.ignoreWarnings);

      mutableSourceMaps[scriptHashToAddress(common.uInt160ToString(crypto.toScriptHash(code)))] = await sourceMap;
      const result = await userAccountProviders.memory.__execute(
        code.toString('hex'),
        { from: masterWallet.account.id, ...options },
        mutableSourceMaps,
      );

      const [invokeReceipt] = await Promise.all([
        result.confirmed({ timeoutMS: 5000 }),
        developerClient.runConsensusNow(),
      ]);
      await checkRawResult(invokeReceipt, mutableSourceMaps);

      return { receipt: invokeReceipt, transaction: result.transaction };
    },
    compileScript: getCompiledScript,
    client,
    readClient: client.read(networkName),
    masterWallet,
    developerClient,
  };
};
