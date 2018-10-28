// tslint:disable no-submodule-imports no-null-keyword
import { Builder } from '@neo-one/local-browser';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
// @ts-ignore
import jestTestHooks from 'jest-circus';
import {
  getState,
  setState,
  // @ts-ignore
} from 'jest-circus/build/state';
// @ts-ignore
import expect from 'jest-matchers';
// @ts-ignore
import jestMock from 'jest-mock';
import { createFileSystem, createTranspileCache } from '../create';
import { RemoteEngine } from '../remote';
import { getPathWithExports } from '../remote/packages';
import { testPackages } from './testPackages';

export interface CreateTestEngineOptions {
  readonly id: string;
  readonly endpoint: comlink.Endpoint;
  readonly builderManager: WorkerManager<typeof Builder>;
  readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
  readonly createJSONRPCLocalProviderManager: () => Promise<WorkerManager<typeof JSONRPCLocalProvider>>;
}

export const createTestEngine = async ({
  id,
  endpoint,
  builderManager,
  jsonRPCLocalProviderManager,
  createJSONRPCLocalProviderManager,
}: CreateTestEngineOptions): Promise<RemoteEngine> => {
  const [fs, transpileCache] = await Promise.all([createFileSystem(id, endpoint), createTranspileCache(id, endpoint)]);

  return new RemoteEngine({
    fs,
    transpileCache,
    builderManager,
    jsonRPCLocalProviderManager,
    createJSONRPCLocalProviderManager,
    pathWithExports: getPathWithExports(
      {
        fs,
        builderManager,
        jsonRPCLocalProviderManager,
        createJSONRPCLocalProviderManager,
      },
      testPackages,
    ),
    globals: {
      ...jestTestHooks,
      expect,
      jest: {
        ...jestMock,
        setTimeout: (testTimeout: number) =>
          setState({
            ...getState(),
            testTimeout,
          }),
      },
    },
  });
};
