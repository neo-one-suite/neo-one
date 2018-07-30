import ts from 'typescript';
import { modifier } from './base';
import * as class_ from './class_';
import * as node_ from './node';
import * as object_ from './object_';

function findOtherProperty<Decl extends ts.GetAccessorDeclaration | ts.SetAccessorDeclaration>(
  node: Decl,
): (Decl extends ts.GetAccessorDeclaration ? ts.SetAccessorDeclaration : ts.GetAccessorDeclaration) | undefined {
  const parent = node_.getParent<ts.GetAccessorDeclaration | ts.SetAccessorDeclaration>(node);
  const kind = node.kind === ts.SyntaxKind.GetAccessor ? ts.SyntaxKind.SetAccessor : ts.SyntaxKind.GetAccessor;
  const thisName = node_.getName(node);

  let properties;
  // tslint:disable-next-line prefer-conditional-expression
  if (ts.isClassDeclaration(parent) || ts.isClassExpression(parent)) {
    properties = modifier.isStatic(node)
      ? class_.getConcreteStaticProperties(parent)
      : class_.getConcreteInstanceProperties(parent);
  } else {
    properties = object_.getProperties(parent);
  }

  // tslint:disable-next-line no-loop-statement
  for (const prop of properties) {
    if (prop.kind === kind && node_.getName(prop) === thisName) {
      // tslint:disable-next-line no-any
      return prop as any;
    }
  }

  return undefined;
}

export function getGetAccessor(node: ts.SetAccessorDeclaration): ts.GetAccessorDeclaration | undefined {
  return findOtherProperty(node);
}

export function getSetAccessor(node: ts.GetAccessorDeclaration): ts.SetAccessorDeclaration | undefined {
  return findOtherProperty(node);
}
