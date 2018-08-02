import { execute } from './execute';

// tslint:disable-next-line export-name
export const vm = {
  executeScripts: execute,
};

// tslint:disable-next-line export-name
export { StackItem, deserializeStackItem } from './stackItem';
