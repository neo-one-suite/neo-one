/// <reference types="@neo-one/types/e2e"/>
type CleanupFunc = () => Promise<void> | void;

export const addCleanup = (func: CleanupFunc) => {
  one.addCleanup(func);
};
