import ts from 'typescript';
import * as utils from './utils';

// tslint:disable-next-line export-name
export function getNamedExports(node: ts.ExportDeclaration): readonly ts.ExportSpecifier[] {
  const namedExports = utils.getValueOrUndefined(node.exportClause);
  if (namedExports === undefined) {
    return [];
  }

  const exps = !ts.isNamedExports(namedExports) ? undefined : utils.getValueOrUndefined(namedExports.elements);

  return exps === undefined ? [] : exps;
}
