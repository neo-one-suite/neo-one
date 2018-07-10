import { InvocationResult } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { Blockchain } from '@neo-one/node-blockchain';
import { test as testNet } from '@neo-one/node-neo-settings';
import { storage } from '@neo-one/node-storage-levelup';
import { vm } from '@neo-one/node-vm';
import LevelUp from 'levelup';
import MemDown from 'memdown';
import { RawSourceMap } from 'source-map';
import Project, { SourceFile } from 'ts-simple-ast';
import { compile } from './compile';
import { throwOnDiagnosticErrorOrWarning } from './utils';

export interface ExecuteOptions {
  readonly prelude?: Buffer;
  readonly ignoreWarnings?: boolean;
}

export const EXECUTE_OPTIONS_DEFAULT = {
  prelude: Buffer.alloc(0, 0),
  ignoreWarnings: false,
};

export const executeScript = async (
  monitor: Monitor,
  ast: Project,
  sourceFile: SourceFile,
  { prelude = Buffer.alloc(0, 0), ignoreWarnings = false }: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT,
): Promise<{ readonly result: InvocationResult; readonly sourceMap: RawSourceMap }> => {
  const blockchain = await Blockchain.create({
    settings: testNet,
    storage: storage({
      context: { messageMagic: testNet.messageMagic },
      db: LevelUp(MemDown()),
    }),
    vm,
    monitor,
  });
  const { code: compiledCode, context, sourceMap } = compile({ ast, sourceFile, addDiagnostics: true });

  throwOnDiagnosticErrorOrWarning(context.diagnostics, ignoreWarnings);

  const result = await blockchain.invokeScript(Buffer.concat([prelude, compiledCode]), monitor);

  return { result, sourceMap };
};
