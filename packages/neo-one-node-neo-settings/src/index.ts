import { main as mainFunc } from './main';
import { test as testFunc } from './test';

export const main = mainFunc();
export const test = testFunc();

export { mainFunc as createMain };
export { testFunc as createTest };
