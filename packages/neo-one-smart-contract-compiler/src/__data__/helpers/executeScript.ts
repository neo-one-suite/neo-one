import { CallReceiptJSON, common, crypto, scriptHashToAddress, SourceMaps } from '@neo-one/client-common';
import { Blockchain } from '@neo-one/node-blockchain';
import { test as testNet } from '@neo-one/node-neo-settings';
import { storage } from '@neo-one/node-storage-levelup';
import { vm } from '@neo-one/node-vm';
import LevelUp from 'levelup';
import MemDown from 'memdown';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
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
  diagnostics: ReadonlyArray<ts.Diagnostic>,
  compiledCode: string,
  sourceMap: Promise<RawSourceMap>,
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
  });

  throwOnDiagnosticErrorOrWarning(diagnostics, ignoreWarnings);

  const code = Buffer.concat([prelude, Buffer.from(compiledCode, 'hex')]);
  const [receipt, resolvedSourceMap] = await Promise.all([blockchain.invokeScript(code), sourceMap]);

  const address = scriptHashToAddress(common.uInt160ToString(crypto.toScriptHash(code)));
  await blockchain.stop();

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
