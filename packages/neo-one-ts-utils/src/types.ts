import ts from 'typescript';

// tslint:disable-next-line export-name
export function getArrayType(typeChecker: ts.TypeChecker): ts.Type {
  // tslint:disable-next-line no-any
  const typeCheckerAny: any = typeChecker;
  const arraySymbol = typeCheckerAny.createArrayType(typeCheckerAny.getAnyType()).symbol;

  return typeChecker.getDeclaredTypeOfSymbol(arraySymbol);
}
