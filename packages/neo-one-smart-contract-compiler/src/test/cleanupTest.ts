import { finalize } from '@neo-one/utils';

type CleanupFunc = () => Promise<void> | void;
const mutableCleanupFuncs: CleanupFunc[] = [];

export const addCleanup = (func: CleanupFunc) => {
  mutableCleanupFuncs.push(func);
};

export const cleanupTest = async () => {
  await Promise.all(mutableCleanupFuncs.map((func) => func()).concat([finalize.wait()]));
};
