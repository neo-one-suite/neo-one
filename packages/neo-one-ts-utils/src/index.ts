import * as accessor from './accessor';
import * as base from './base';
import * as class_ from './class_';
import * as declaration from './declaration';
import * as exportDeclaration from './exportDeclaration';
import * as exportSpecifier from './exportSpecifier';
import * as expression from './expression';
import * as file from './file';
import * as guards from './guards';
import * as identifier from './identifier';
import * as importDeclaration from './importDeclaration';
import * as importExport from './importExport';
import * as literal from './literal';
import * as node from './node';
import * as object_ from './object_';
import * as parameter from './parameter';
import { markOriginal, print, setOriginal, setOriginalRecursive } from './print';
import * as reference from './reference';
import * as signature from './signature';
import * as statement from './statement';
import * as symbol from './symbol';
import * as template from './template';
import * as type_ from './type_';
import * as types from './types';
import * as variable from './variable';

export { ArgumentedNode, BodiedNode, BodyableNode, ParameteredNode } from './base';
export { PropertyNamedNode } from './node';
export { StatementedNode } from './statement';
export { ClassInstanceMemberType } from './class_';

// tslint:disable-next-line export-name
export const tsUtils = {
  ...base,
  accessor,
  class_,
  declaration,
  exportDeclaration,
  exportSpecifier,
  expression,
  file,
  guards,
  identifier,
  importDeclaration,
  importExport,
  literal,
  markOriginal,
  node,
  object_,
  parameter,
  print,
  reference,
  setOriginal,
  setOriginalRecursive,
  signature,
  statement,
  symbol,
  template,
  type_,
  types,
  variable,
};
