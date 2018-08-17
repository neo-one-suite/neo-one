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
  SmartContract,
  UserAccountID,
} from '@neo-one/client';
import { RawInvokeReceipt } from '@neo-one/client-core';
import ts from 'typescript';
import { testNodeSetup } from '../../../../neo-one-smart-contract-test/src/setupTest';
import { compile } from '../../compile';
import { CompileResult } from '../../compile/types';
import { createContextForSnippet } from '../../createContext';
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

export interface TestNode {
  readonly addContract: (script: string) => Promise<Contract>;
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

export const startNode = async (outerOptions: StartNodeOptions = {}): Promise<TestNode> => {
  const { client, masterWallet, provider, networkName, userAccountProviders } = await testNodeSetup();
  const developerClient = new DeveloperClient(provider.read(networkName));

  return {
    async addContract(script): Promise<Contract> {
      const { code, context } = getCompiledScript(script);

      throwOnDiagnosticErrorOrWarning(context.diagnostics, outerOptions.ignoreWarnings);

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
    },
    async executeString(
      script,
      options = {},
    ): Promise<{ readonly receipt: RawInvokeReceipt; readonly transaction: InvocationTransaction }> {
      const { code, sourceMap, context } = getCompiledScript(script);

      throwOnDiagnosticErrorOrWarning(context.diagnostics, outerOptions.ignoreWarnings);

      const resolvedSourceMap = await sourceMap;
      const result = await userAccountProviders.memory.__execute(
        code.toString('hex'),
        { from: masterWallet.account.id, ...options },
        resolvedSourceMap,
      );

      const [invokeReceipt] = await Promise.all([
        result.confirmed({ timeoutMS: 5000 }),
        developerClient.runConsensusNow(),
      ]);
      await checkRawResult(invokeReceipt, resolvedSourceMap);

      return { receipt: invokeReceipt, transaction: result.transaction };
    },
    compileScript: getCompiledScript,
    client,
    readClient: client.read(networkName),
    masterWallet,
    developerClient,
  };
};
