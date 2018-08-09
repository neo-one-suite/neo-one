import ts from 'typescript';
import * as type_ from './type_';

export function getParameters(signature: ts.Signature): ReadonlyArray<ts.Symbol> {
  return signature.parameters;
}

export function getReturnType(signature: ts.Signature): ts.Type {
  return signature.getReturnType();
}

export function isFailure(signature: ts.Signature): boolean {
  // tslint:disable-next-line no-any
  const sig: any = signature;

  return (
    sig.declaration === undefined &&
    sig.typeParameters === undefined &&
    sig.thisParameter === undefined &&
    sig.parameters.length === 0 &&
    type_.isAny(sig.resolvedReturnType) &&
    sig.resolvedTypePredicate === undefined &&
    sig.minArgumentCount === 0 &&
    !sig.hasRestParameter &&
    !sig.hasLiteralTypes
  );
}
