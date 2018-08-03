// tslint:disable-next-line export-name
export const GLOBAL_PROPERTIES = new Set([
  'Boolean',
  'Buffer',
  'Error',
  'Map',
  'Number',
  'Object',
  'String',
  'Symbol',
  'process',
]);

export type GlobalProperty =
  | 'Boolean'
  | 'Buffer'
  | 'Error'
  | 'Map'
  | 'Number'
  | 'Object'
  | 'String'
  | 'Symbol'
  | 'process';
