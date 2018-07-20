type CleanupFunc = () => Promise<void> | void;

export const addCleanup = (func: CleanupFunc) => {
  one.addCleanup(func);
};
