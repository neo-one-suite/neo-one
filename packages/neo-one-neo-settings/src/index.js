/* @flow */
import mainFunc from './main';
import testFunc from './test';

export const main = mainFunc();
export const test = testFunc();

export { default as createMain } from './main';
export { default as createTest } from './test';
