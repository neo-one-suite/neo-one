import ts from 'typescript';
import * as utils from './utils';

// tslint:disable-next-line export-name
export function getNamedExports(node: ts.ExportDeclaration): ReadonlyArray<ts.ExportSpecifier> {
  const namedExports = utils.getValueOrUndefined(node.exportClause);
  if (namedExports === undefined) {
    return [];
  }

  const exps = utils.getValueOrUndefined(namedExports.elements);

  return exps === undefined ? [] : exps;
}
