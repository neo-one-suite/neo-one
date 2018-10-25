// tslint:disable match-default-export-name no-submodule-imports no-implicit-dependencies
// @ts-ignore
import testRunnerUrl from 'file-loader?name=[hash].[name].[ext]!../../../../../dist/workers/testRunner.worker.js';

export const TestRunnerWorker = () => new Worker(testRunnerUrl);
