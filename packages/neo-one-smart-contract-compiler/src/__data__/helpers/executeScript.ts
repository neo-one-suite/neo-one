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
import { storage, streamToObservable } from '@neo-one/node-storage-levelup';
import { blockchainSettingsToProtocolSettings, Dispatcher } from '@neo-one/node-vm';
// import fs from 'fs-extra';
import LevelUp from 'levelup';
import MemDown from 'memdown';
import { toArray } from 'rxjs/operators';
// import RocksDB from 'rocksdb';
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

// tslint:disable-next-line: no-any
const getUpdateVMMemoryStore = (vm: Dispatcher, db: any) => async () => {
  const updates = await streamToObservable<{ readonly key: Buffer; readonly value: Buffer }>(() =>
    db.createReadStream(),
  )
    .pipe(toArray())
    .toPromise();

  vm.updateStore(updates);
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
  // const path = `/Users/spencercorwin/Desktop/node-test-data-${Math.random() * 100000000}`;
  // await fs.ensureDir(path);
  // const db = LevelUp(RocksDB(path));
  const settings = testNet();
  const vm = new Dispatcher({
    // levelDBPath: path,
    protocolSettings: blockchainSettingsToProtocolSettings(settings),
  });
  const db = LevelUp(MemDown());
  const blockchain = await Blockchain.create({
    settings,
    storage: storage({
      context: {
        network: settings.network,
        validatorsCount: settings.validatorsCount,
        maxValidUntilBlockIncrement: settings.maxValidUntilBlockIncrement,
      },
      db,
    }),
    vm,
    native: new NativeContainer(settings),
    onPersist: getUpdateVMMemoryStore(vm, db),
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
      state: toVMStateJSON(receipt.state) as 'HALT' | 'FAULT',
      gasconsumed: receipt.gasConsumed.toString(),
      stack: receipt.stack.map((stackItem) => stackItem.toContractParameter().serializeJSON()),
      notifications: receipt.notifications.map((n) => n.serializeJSON()),
      logs: receipt.logs.map((log) => ({
        message: log.message,
        containerhash: log.containerHash ? common.uInt256ToString(log.containerHash) : undefined,
        callingscripthash: common.uInt160ToString(log.callingScriptHash),
        position: log.position,
      })),
    },
    sourceMaps: {
      [address]: resolvedSourceMap,
    },
  };
};
