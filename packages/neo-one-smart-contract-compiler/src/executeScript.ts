import { InvocationResult } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import Blockchain from '@neo-one/node-blockchain';
import Project, { DiagnosticCategory, SourceFile } from 'ts-simple-ast';

import { test as testNet } from '@neo-one/node-neo-settings';
import levelUpStorage from '@neo-one/node-storage-levelup';
import { vm } from '@neo-one/node-vm';
import LevelUp from 'levelup';
import MemDown from 'memdown';

import { compile } from './compile';

export const executeScript = async (
  monitor: Monitor,
  ast: Project,
  sourceFile: SourceFile,
  prelude: Buffer = Buffer.alloc(0, 0),
): Promise<InvocationResult> => {
  const blockchain = await Blockchain.create({
    settings: testNet,
    storage: levelUpStorage({
      context: { messageMagic: testNet.messageMagic },
      db: LevelUp(MemDown()),
    }),
    vm,
    monitor,
  });
  const { code: compiledCode, context } = compile({ ast, sourceFile });
  const error = context.diagnostics.find((diagnostic) => diagnostic.category === DiagnosticCategory.Error);
  if (error !== undefined) {
    throw new Error(`Compilation error: ${error.messageText} at ${error.source}`);
  }

  return blockchain.invokeScript(Buffer.concat([prelude, compiledCode]), monitor);
};
