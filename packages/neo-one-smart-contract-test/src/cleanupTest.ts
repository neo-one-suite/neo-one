import { finalize } from '@neo-one/utils';

type CleanupFunc = () => Promise<void> | void;
const cleanupFuncs: CleanupFunc[] = [];

export const addCleanup = (func: CleanupFunc) => {
  cleanupFuncs.push(func);
};

export const cleanupTest = async () => {
  await Promise.all(
    cleanupFuncs.map((func) => func()).concat([finalize.wait()]),
  );
};
