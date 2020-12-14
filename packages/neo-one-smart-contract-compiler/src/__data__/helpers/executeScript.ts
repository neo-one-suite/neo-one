import { CallReceiptJSON, common, crypto, scriptHashToAddress, SourceMaps } from '@neo-one/client-common';
import { Blockchain } from '@neo-one/node-blockchain';
import { test as testNet } from '@neo-one/node-neo-settings';
import { storage } from '@neo-one/node-storage-levelup';
import { Dispatcher, blockchainSettingsToProtocolSettings } from '@neo-one/node-vm';
import LevelUp from 'levelup';
import MemDown from 'memdown';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { throwOnDiagnosticErrorOrWarning } from '../../utils';
import { NativeContainer } from '@neo-one/node-native';

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
  const settings = testNet();
  const dispatcher = new Dispatcher({ protocolSettings: blockchainSettingsToProtocolSettings(settings) });
  const blockchain = await Blockchain.create({
    settings,
    storage: storage({
      context: { messageMagic: settings.messageMagic, validatorsCount: settings.validatorsCount },
      db: LevelUp(MemDown()),
    }),
    vm: dispatcher,
    native: new NativeContainer(settings),
  });

  throwOnDiagnosticErrorOrWarning(diagnostics, ignoreWarnings);

  const code = Buffer.concat([prelude, Buffer.from(compiledCode, 'hex')]);
  const [receipt, resolvedSourceMap] = await Promise.all([blockchain.invokeScript(code), sourceMap]);

  const address = scriptHashToAddress(common.uInt160ToString(crypto.toScriptHash(code)));
  await blockchain.stop();

  // TODO: pickup here, how are we converting this?
  return {
    receipt: {
      result: receipt,
      actions: receipt.actions.map((action) => action.serializeJSON(blockchain.serializeJSONContext)),
    },
    sourceMaps: {
      [address]: resolvedSourceMap,
    },
  };
};
