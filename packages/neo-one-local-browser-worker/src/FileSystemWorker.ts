// tslint:disable match-default-export-name no-submodule-imports no-implicit-dependencies
// @ts-ignore
import fsWorkerURL from 'file-loader?name=[hash].[name].[ext]!../../../dist/workers/fs.worker.js';

export const FileSystemWorker = () => new Worker(fsWorkerURL);
