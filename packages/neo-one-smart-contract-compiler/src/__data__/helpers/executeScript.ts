import {
  CallReceiptJSON,
  common,
  crypto,
  scriptHashToAddress,
  SourceMaps,
  toVMStateJSON,
} from '@neo-one/client-common';
import { Blockchain } from '@neo-one/node-blockchain';
import { NativeContainer } from '@neo-one/node-native';
import { test as testNet } from '@neo-one/node-neo-settings';
import { storage } from '@neo-one/node-storage-levelup';
import { blockchainSettingsToProtocolSettings, Dispatcher } from '@neo-one/node-vm';
// import MemDown from 'memdown';
import fs from 'fs-extra';
import LevelUp from 'levelup';
import RocksDB from 'rocksdb';
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
  const settings = testNet();
  const dataPath = `/Users/spencercorwin/Desktop/node-data-test-${Math.random() * 100000}`;
  await fs.ensureDir(dataPath);
  const db = LevelUp(RocksDB(dataPath));
  const dispatcher = new Dispatcher({
    levelDBPath: dataPath,
    protocolSettings: blockchainSettingsToProtocolSettings(settings),
  });
  const blockchain = await Blockchain.create({
    settings,
    storage: storage({
      context: { messageMagic: settings.messageMagic, validatorsCount: settings.validatorsCount },
      db, // LevelUp(MemDown()),
    }),
    vm: dispatcher,
    native: new NativeContainer(settings),
  });

  throwOnDiagnosticErrorOrWarning(diagnostics, ignoreWarnings);

  const script = Buffer.concat([prelude, Buffer.from(compiledCode, 'hex')]);
  const receipt = blockchain.invokeScript({ script });
  const resolvedSourceMap = await sourceMap;

  const address = scriptHashToAddress(common.uInt160ToString(crypto.toScriptHash(script)));
  await blockchain.stop();

  return {
    receipt: {
      script: compiledCode,
      state: toVMStateJSON(receipt.state),
      gasconsumed: receipt.gasConsumed.toString(),
      stack: receipt.stack.map((stackItem) => stackItem.toContractParameter().serializeJSON()),
      notifications: receipt.notifications.map((n) => n.serializeJSON()),
      logs: receipt.logs.map((log) => ({
        message: log.message,
        containerhash: log.containerHash ? common.uInt256ToString(log.containerHash) : undefined,
        callingscripthash: common.uInt160ToString(log.callingScriptHash),
      })),
    },
    sourceMaps: {
      [address]: resolvedSourceMap,
    },
  };
};
