// tslint:disable match-default-export-name no-submodule-imports no-implicit-dependencies
// @ts-ignore
import transpilerUrl from 'file-loader?name=[hash].[name].[ext]!../../../../../dist/website/transpiler.worker.js';

export const TranspilerWorker = () => new Worker(transpilerUrl);
