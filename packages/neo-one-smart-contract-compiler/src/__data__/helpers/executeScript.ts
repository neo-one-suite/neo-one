import { SourceMaps } from '@neo-one/client';
import { CallReceiptJSON, common, crypto, scriptHashToAddress } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { Blockchain } from '@neo-one/node-blockchain';
import { test as testNet } from '@neo-one/node-neo-settings';
import { storage } from '@neo-one/node-storage-levelup';
import { vm } from '@neo-one/node-vm';
import LevelUp from 'levelup';
import MemDown from 'memdown';
import ts from 'typescript';
import { compile } from '../../compile';
import { Context } from '../../Context';
import { throwOnDiagnosticErrorOrWarning } from '../../utils';

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
  context: Context,
  sourceFile: ts.SourceFile,
  { prelude = Buffer.alloc(0, 0), ignoreWarnings = false }: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT,
): Promise<{
  readonly receipt: CallReceiptJSON;
  readonly sourceMaps: SourceMaps;
}> => {
  const blockchain = await Blockchain.create({
    settings: testNet(),
    storage: storage({
      context: { messageMagic: testNet().messageMagic },
      db: LevelUp(MemDown()),
    }),
    vm,
    monitor,
  });
  const { code: compiledCode, sourceMap } = compile({ context, sourceFile });

  throwOnDiagnosticErrorOrWarning(context.diagnostics, ignoreWarnings);

  const code = Buffer.concat([prelude, compiledCode]);
  const [receipt, resolvedSourceMap] = await Promise.all([blockchain.invokeScript(code, monitor), sourceMap]);

  const address = scriptHashToAddress(common.uInt160ToString(crypto.toScriptHash(code)));

  return {
    receipt: {
      result: receipt.result.serializeJSON(blockchain.serializeJSONContext),
      actions: receipt.actions.map((action) => action.serializeJSON(blockchain.serializeJSONContext)),
    },
    sourceMaps: {
      [address]: resolvedSourceMap,
    },
  };
};
