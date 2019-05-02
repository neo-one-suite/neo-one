// tslint:disable no-any
import ts from 'typescript';
import { modifier } from './base';
import * as file from './file';
import * as node_ from './node';
import * as utils from './utils';

function getNodeForReferences(node: node_.AnyNameableNode | ts.Identifier): ts.Node {
  if (ts.isIdentifier(node)) {
    return node;
  }

  const name = node_.getNameNode(node);
  if (name !== undefined) {
    if (ts.isArrayBindingPattern(name) || ts.isObjectBindingPattern(name)) {
      return node;
    }

    return name;
  }

  const exp = modifier.getDefaultKeyword(node);
  if (exp !== undefined && modifier.isDefaultExport(node)) {
    return exp;
  }

  return node;
}

export function findReferences(
  languageService: ts.LanguageService,
  node: node_.AnyNameableNode | ts.Identifier,
): readonly ts.ReferencedSymbol[] {
  return utils.getArray(
    languageService.findReferences(node.getSourceFile().fileName, getNodeForReferences(node).getStart()),
  );
}

export function getNodesForReferences(
  program: ts.Program,
  symbols: readonly ts.ReferencedSymbol[],
): readonly ts.Node[] {
  return symbols.reduce<readonly ts.Node[]>((acc, symbol) => {
    const isAlias = symbol.definition.kind === ts.ScriptElementKind.alias;
    const references = isAlias ? symbol.references : symbol.references.filter((reference) => !reference.isDefinition);

    return acc.concat(
      references.map((reference) => {
        const sourceFile = file.getSourceFileOrThrow(program, reference.fileName);

        return utils.throwIfNullOrUndefined(
          node_.getDescendantAtPos(sourceFile, reference.textSpan.start),
          'referenced node',
        );
      }),
    );
  }, []);
}

export function findReferencesAsNodes(
  program: ts.Program,
  languageService: ts.LanguageService,
  node: node_.AnyNameableNode | ts.Identifier,
): readonly ts.Node[] {
  return getNodesForReferences(program, findReferences(languageService, node));
}
