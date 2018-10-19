// tslint:disable match-default-export-name no-implicit-dependencies no-submodule-imports
// @ts-ignore
import jsonRPCLocalProviderWorkerURL from 'file-loader?name=[hash].[name].[ext]!../../../dist/workers/jsonRPCLocalProvider.worker.js';

export const JSONRPCLocalProviderWorker = () => new Worker(jsonRPCLocalProviderWorkerURL);
