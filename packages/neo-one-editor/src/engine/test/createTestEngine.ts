// tslint:disable no-submodule-imports no-null-keyword
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import * as jestTestHooks from 'jest-circus';
import { getState, setState } from 'jest-circus/build/state';
import expect from 'jest-matchers';
import JestMock from 'jest-mock';
import { createFileSystem, createTranspileCache } from '../create';
import { RemoteEngine } from '../remote';
import { getPathWithExports } from '../remote/packages';
import { testPackages } from './testPackages';

export interface CreateTestEngineOptions {
  readonly id: string;
  readonly endpoint: comlink.Endpoint;
  readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
  readonly createJSONRPCLocalProviderManager: () => Promise<WorkerManager<typeof JSONRPCLocalProvider>>;
}

export const createTestEngine = async ({
  id,
  endpoint,
  jsonRPCLocalProviderManager,
  createJSONRPCLocalProviderManager,
}: CreateTestEngineOptions): Promise<RemoteEngine> => {
  const [fs, transpileCache] = await Promise.all([createFileSystem(id, endpoint), createTranspileCache(id, endpoint)]);

  return new RemoteEngine({
    fs,
    transpileCache,
    jsonRPCLocalProviderManager,
    createJSONRPCLocalProviderManager,
    pathWithExports: getPathWithExports(
      {
        fs,
        jsonRPCLocalProviderManager,
        createJSONRPCLocalProviderManager,
      },
      testPackages,
    ),
    globals: {
      ...jestTestHooks,
      expect,
      jest: {
        ...JestMock,
        setTimeout: (testTimeout: number) =>
          setState({
            ...getState(),
            testTimeout,
          }),
      },
    },
  });
};
