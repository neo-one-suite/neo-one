// tslint:disable match-default-export-name no-submodule-imports no-implicit-dependencies
// @ts-ignore
import transpilerUrl from 'file-loader?name=[hash].[name].[ext]!../../../../../../dist/workers/transpiler.worker.js';

export const TranspilerWorker = () => new Worker(transpilerUrl);
