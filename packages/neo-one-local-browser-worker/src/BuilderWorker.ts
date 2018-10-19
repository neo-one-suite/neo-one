// tslint:disable match-default-export-name no-submodule-imports no-implicit-dependencies
// @ts-ignore
import builderWorkerURL from 'file-loader?name=[hash].[name].[ext]!../../../dist/workers/builder.worker.js';

export const BuilderWorker = () => new Worker(builderWorkerURL);
