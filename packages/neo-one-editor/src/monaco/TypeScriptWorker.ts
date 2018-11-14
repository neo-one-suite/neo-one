// tslint:disable match-default-export-name no-submodule-imports no-implicit-dependencies
// @ts-ignore
import asyncLanguageServiceUrl from 'file-loader?name=[hash].[name].[ext]!../../../../dist/workers/ts.worker.js';

export const TypeScriptWorker = () => new Worker(asyncLanguageServiceUrl);
