import Blockchain from '@neo-one/node-blockchain';
import Ast, { DiagnosticCategory, SourceFile } from 'ts-simple-ast';
import { InvocationResult } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';

import levelup from 'levelup';
import levelUpStorage from '@neo-one/node-storage-levelup';
import memdown from 'memdown';
import { test as testNet } from '@neo-one/node-neo-settings';
import vm from '@neo-one/node-vm';

import { compile } from './compile';

export const executeScript = async (
  monitor: Monitor,
  ast: Ast,
  sourceFile: SourceFile,
  prelude: Buffer = Buffer.alloc(0, 0),
): Promise<InvocationResult> => {
  const blockchain = await Blockchain.create({
    log: () => {
      // tslint:disable-next-line
    },
    settings: testNet,
    storage: levelUpStorage({
      context: { messageMagic: testNet.messageMagic },
      db: levelup(
        // @ts-ignore
        memdown(),
      ),
    }),
    vm,
    monitor,
  });
  const { code: compiledCode, context } = compile({ ast, sourceFile });
  const error = context.diagnostics.filter(
    (diagnostic) => diagnostic.category === DiagnosticCategory.Error,
  )[0];
  if (error != null) {
    throw new Error(
      `Compilation error: ${error.messageText} at ${error.source}`,
    );
  }

  const result = await blockchain.invokeScript(
    Buffer.concat([prelude, compiledCode]),
    monitor,
  );
  return result;
};
