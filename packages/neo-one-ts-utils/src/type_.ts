// tslint:disable no-bitwise
import ts from 'typescript';
import * as guards from './guards';
import * as symbol_ from './symbol';
import * as utils from './utils';

type TypedNode = ts.Node & { readonly type?: ts.TypeNode };
type MaybeTypedNode = ts.Node & { readonly type?: ts.TypeNode };

export function getTypeNode(node: TypedNode): ts.TypeNode;
export function getTypeNode(node: MaybeTypedNode): ts.TypeNode | undefined;
export function getTypeNode(node: TypedNode | MaybeTypedNode): ts.TypeNode | undefined {
  return utils.getValueOrUndefined(node.type);
}

export function getTypeNodeOrThrow(node: MaybeTypedNode): ts.TypeNode {
  return utils.throwIfNullOrUndefined(getTypeNode(node), 'type node');
}

export function getContextualType(typeChecker: ts.TypeChecker, node: ts.Expression): ts.Type | undefined {
  return utils.getValueOrUndefined(typeChecker.getContextualType(node));
}

export function getTypeFromTypeNode(typeChecker: ts.TypeChecker, typeNode: ts.TypeNode): ts.Type {
  return typeChecker.getTypeFromTypeNode(typeNode);
}

export function getType(typeChecker: ts.TypeChecker, node: ts.Node): ts.Type {
  // tslint:disable-next-line no-any
  const typeNode = ts.isFunctionLike(node) ? undefined : (getTypeNode(node as any) as ts.TypeNode | undefined);
  if (typeNode !== undefined) {
    return typeChecker.getTypeFromTypeNode(typeNode);
  }

  const type = typeChecker.getTypeAtLocation(node);

  if (isAny(type) && guards.isExpression(node)) {
    const contextualType = getContextualType(typeChecker, node);
    if (contextualType !== undefined && !isAny(contextualType)) {
      return contextualType;
    }
  }

  return type;
}

export function getConstraint(type: ts.Type): ts.Type | undefined {
  return utils.getValueOrUndefined(type.getConstraint());
}

export function getTypeAtLocation(typeChecker: ts.TypeChecker, symbol: ts.Symbol, node: ts.Node): ts.Type {
  return typeChecker.getTypeOfSymbolAtLocation(symbol, node);
}

export function typeToTypeNode(
  typeChecker: ts.TypeChecker,
  type: ts.Type,
  node?: ts.Declaration,
): ts.TypeNode | undefined {
  return typeChecker.typeToTypeNode(type, node);
}

export function typeToTypeNodeOrThrow(typeChecker: ts.TypeChecker, type: ts.Type, node?: ts.Declaration): ts.TypeNode {
  return utils.throwIfNullOrUndefined(typeToTypeNode(typeChecker, type, node), 'type node');
}

export function getSymbol(type: ts.Type): ts.Symbol | undefined {
  return utils.getValueOrUndefined(type.getSymbol());
}

export function getAliasSymbol(type: ts.Type): ts.Symbol | undefined {
  return utils.getValueOrUndefined(type.aliasSymbol);
}

export function getSymbolOrThrow(type: ts.Type): ts.Symbol {
  return utils.throwIfNullOrUndefined(getSymbol(type), 'symbol');
}

function getDefaultTypeFormatFlags(node?: ts.Node): ts.TypeFormatFlags {
  let formatFlags =
    ts.TypeFormatFlags.UseTypeOfFunction |
    ts.TypeFormatFlags.NoTruncation |
    ts.TypeFormatFlags.UseFullyQualifiedType |
    ts.TypeFormatFlags.WriteTypeArgumentsOfSignature;

  if (node !== undefined && node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
    formatFlags |= ts.TypeFormatFlags.InTypeAlias;
  }

  return formatFlags;
}

export function getProperties(type: ts.Type): ReadonlyArray<ts.Symbol> {
  return type.getProperties();
}

export function getConstructSignatures(type: ts.Type): ReadonlyArray<ts.Signature> {
  return type.getConstructSignatures();
}

export function getProperty(type: ts.Type, name: string): ts.Symbol | undefined {
  return utils.getValueOrUndefined(type.getProperty(name));
}

export function getText(
  typeChecker: ts.TypeChecker,
  type: ts.Type,
  node?: ts.Node,
  flags: ts.TypeFormatFlags = getDefaultTypeFormatFlags(node),
): string {
  return typeChecker.typeToString(type, node, flags);
}

export function getBaseTypes(type: ts.Type): ReadonlyArray<ts.Type> | undefined {
  return utils.getValueOrUndefined(type.getBaseTypes());
}

export function getBaseTypesArray(type: ts.Type): ReadonlyArray<ts.Type> {
  return utils.getArray(getBaseTypes(type));
}

function isTypeFlag(type: ts.Type, flag: ts.TypeFlags): boolean {
  return (type.flags & flag) === flag;
}
function isObjectFlag(type: ts.Type, flag: ts.ObjectFlags): boolean {
  return isObjectType(type) && (type.objectFlags & flag) === flag;
}
function hasTypeFlag(type: ts.Type, flag: ts.TypeFlags): boolean {
  return (type.flags & flag) !== 0;
}

export function getAllTypes(type: ts.Type): ReadonlyArray<ts.Type> {
  const unionTypes = getUnionTypes(type);
  if (unionTypes !== undefined) {
    return unionTypes.reduce<ReadonlyArray<ts.Type>>((acc, unionType) => acc.concat(getAllTypes(unionType)), []);
  }

  const intersectionTypes = getIntersectionTypes(type);
  if (intersectionTypes !== undefined) {
    return intersectionTypes.reduce<ReadonlyArray<ts.Type>>((acc, unionType) => acc.concat(getAllTypes(unionType)), []);
  }

  return [type];
}

export function getTypes(type: ts.Type, isType: (type: ts.Type) => boolean): ReadonlyArray<ts.Type> {
  if (isType(type)) {
    return [type];
  }

  const unionTypes = getUnionTypes(type);
  if (unionTypes !== undefined) {
    return unionTypes.reduce<ReadonlyArray<ts.Type>>((acc, unionType) => acc.concat(getTypes(unionType, isType)), []);
  }

  const intersectionTypes = getIntersectionTypes(type);
  if (intersectionTypes !== undefined) {
    return intersectionTypes.reduce<ReadonlyArray<ts.Type>>(
      (acc, unionType) => acc.concat(getTypes(unionType, isType)),
      [],
    );
  }

  return [];
}

export function isSymbolic(type: ts.Type): boolean {
  return !(isPrimitiveish(type) || isIntersection(type) || isUnion(type) || isTuple(type));
}
export function isObjectType(type: ts.Type): type is ts.ObjectType {
  return isTypeFlag(type, ts.TypeFlags.Object);
}
export function isTypeReference(type: ts.Type): type is ts.TypeReference {
  return isObjectFlag(type, ts.ObjectFlags.Reference);
}

export function isTupleType(type: ts.Type): type is ts.TupleType {
  return isObjectFlag(type, ts.ObjectFlags.Tuple);
}
export function isTuple(type: ts.Type): type is ts.TupleTypeReference {
  return isTypeReference(type) && isTupleType(type.target);
}
export function hasTuple(type: ts.Type): boolean {
  return hasType(type, isTuple);
}
export function getTupleTypes(type: ts.Type): ReadonlyArray<ts.Type> {
  return getTypes(type, isTuple);
}
// If undefined => not a tuple type
export function getTupleElements(type: ts.Type): ReadonlyArray<ts.Type> | undefined {
  return isTuple(type) ? utils.getArray(type.typeArguments) : undefined;
}

export function getTypeArguments(type: ts.Type): ReadonlyArray<ts.Type> | undefined {
  return isTypeReference(type) ? utils.getValueOrUndefined(type.typeArguments) : undefined;
}

export function getTypeArgumentsArray(type: ts.Type): ReadonlyArray<ts.Type> {
  return utils.getArray(getTypeArguments(type));
}

export function getTypeArgumentsOrThrow(type: ts.Type): ReadonlyArray<ts.Type> {
  return utils.throwIfNullOrUndefined(getTypeArguments(type), 'type arguments');
}

export function isAny(type: ts.Type): boolean {
  return hasTypeFlag(type, ts.TypeFlags.Any);
}

export function isErrorType(type: ts.Type): boolean {
  // tslint:disable-next-line no-any
  return isAny(type) && (type as any).intrinsicName === 'error';
}

export function isUnion(type: ts.Type): type is ts.UnionType {
  // tslint:disable-next-line no-any
  return (type as any).isUnion === undefined ? false : type.isUnion();
}

export function getUnionTypes(type: ts.Type): ReadonlyArray<ts.Type> | undefined {
  return isUnion(type) ? utils.getArray(type.types) : undefined;
}
export function getUnionTypesArray(type: ts.Type): ReadonlyArray<ts.Type> {
  return utils.getArray(getUnionTypes(type));
}

export function isIntersection(type: ts.Type): type is ts.IntersectionType {
  // tslint:disable-next-line no-any
  return (type as any).isIntersection === undefined ? false : type.isIntersection();
}

export function getIntersectionTypes(type: ts.Type): ReadonlyArray<ts.Type> | undefined {
  return isIntersection(type) ? utils.getArray(type.types) : undefined;
}

export function getIntersectionTypesArray(type: ts.Type): ReadonlyArray<ts.Type> {
  return utils.getArray(getIntersectionTypes(type));
}

export function hasUnionType(type: ts.Type, isType: (type: ts.Type) => boolean): boolean {
  const unionTypes = getUnionTypes(type);

  return unionTypes !== undefined && unionTypes.some(isType);
}

export function hasIntersectionType(type: ts.Type, isType: (type: ts.Type) => boolean): boolean {
  const types = getIntersectionTypes(type);

  return types !== undefined && types.some(isType);
}

export function hasType(type: ts.Type, isType: (type: ts.Type) => boolean): boolean {
  return isType(type) || hasUnionType(type, isType) || hasIntersectionType(type, isType);
}

export function isOnlyType(type: ts.Type, isType: (type: ts.Type) => boolean): boolean {
  if (isType(type)) {
    return true;
  }

  const unionTypes = getUnionTypes(type);
  if (unionTypes !== undefined && unionTypes.every((tpe) => isOnlyType(tpe, isType))) {
    return true;
  }

  const intersectionTypes = getIntersectionTypes(type);
  if (intersectionTypes !== undefined && intersectionTypes.every((tpe) => isOnlyType(tpe, isType))) {
    return true;
  }

  return false;
}

export function isSame(a: ts.Type | undefined, b: ts.Type | undefined): boolean {
  return (
    a !== undefined &&
    b !== undefined &&
    (a === b ||
      (isOnlyBooleanish(a) && isOnlyBooleanish(b)) ||
      (isOnlyStringish(a) && isOnlyStringish(b)) ||
      (isOnlyNumberish(a) && isOnlyNumberish(b)) ||
      (isOnlySymbolish(a) && isOnlySymbolish(b)))
  );
}

export function isOnly(type: ts.Type): boolean {
  return [...new Set(getAllTypes(type))].length === 0;
}

export function isNull(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.Null);
}
export function isOnlyNull(type: ts.Type): boolean {
  return isOnlyType(type, isNull);
}
export function hasNull(type: ts.Type): boolean {
  return hasType(type, isNull);
}

export function isUndefined(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.Undefined);
}
export function isOnlyUndefined(type: ts.Type): boolean {
  return isOnlyType(type, isUndefined);
}
export function hasUndefined(type: ts.Type): boolean {
  return hasType(type, isUndefined);
}
export function isUndefinedish(type: ts.Type): boolean {
  return isUndefined(type) || isVoid(type);
}
export function isOnlyUndefinedish(type: ts.Type): boolean {
  return isOnlyType(type, isUndefinedish);
}
export function hasUndefinedish(type: ts.Type): boolean {
  return hasType(type, isUndefinedish);
}

export function isNullable(type: ts.Type): boolean {
  const types = getUnionTypes(type);

  return (
    isNull(type) || isUndefined(type) || (types !== undefined && types.some((tpe) => isNull(tpe) || isUndefined(tpe)))
  );
}

export function isNumber(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.Number);
}
export function isOnlyNumber(type: ts.Type): boolean {
  return isOnlyType(type, isNumber);
}
export function hasNumber(type: ts.Type): boolean {
  return hasType(type, isNumber);
}
export function isNumberLike(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.NumberLike);
}
export function isOnlyNumberLike(type: ts.Type): boolean {
  return isOnlyType(type, isNumberLike);
}
export function hasNumberLike(type: ts.Type): boolean {
  return hasType(type, isNumberLike);
}
export function isNumberLiteral(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.NumberLiteral);
}
export function isOnlyNumberLiteral(type: ts.Type): boolean {
  return isOnlyType(type, isNumberLiteral);
}
export function hasNumberLiteral(type: ts.Type): boolean {
  return hasType(type, isNumberLiteral);
}
export function isNumberish(type: ts.Type): boolean {
  return hasTypeFlag(type, ts.TypeFlags.NumberLike);
}
export function isOnlyNumberish(type: ts.Type): boolean {
  return isOnlyType(type, isNumberish);
}
export function hasNumberish(type: ts.Type): boolean {
  return hasType(type, isNumberish);
}

export function isString(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.String);
}
export function isOnlyString(type: ts.Type): boolean {
  return isOnlyType(type, isString);
}
export function hasString(type: ts.Type): boolean {
  return hasType(type, isString);
}
export function isStringLike(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.StringLike);
}
export function isOnlyStringLike(type: ts.Type): boolean {
  return isOnlyType(type, isStringLike);
}
export function hasStringLike(type: ts.Type): boolean {
  return hasType(type, isStringLike);
}
export function isStringLiteral(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.StringLiteral);
}
export function isOnlyStringLiteral(type: ts.Type): boolean {
  return isOnlyType(type, isStringLiteral);
}
export function hasStringLiteral(type: ts.Type): boolean {
  return hasType(type, isStringLiteral);
}
export function isStringish(type: ts.Type): boolean {
  return hasTypeFlag(type, ts.TypeFlags.StringLike);
}
export function isOnlyStringish(type: ts.Type): boolean {
  return isOnlyType(type, isStringish);
}
export function hasStringish(type: ts.Type): boolean {
  return hasType(type, isStringish);
}

export function isBoolean(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.Boolean);
}
export function isOnlyBoolean(type: ts.Type): boolean {
  return isOnlyType(type, isBoolean);
}
export function hasBoolean(type: ts.Type): boolean {
  return hasType(type, isBoolean);
}
export function isBooleanLike(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.BooleanLike);
}
export function isOnlyBooleanLike(type: ts.Type): boolean {
  return isOnlyType(type, isBooleanLike);
}
export function hasBooleanLike(type: ts.Type): boolean {
  return hasType(type, isBooleanLike);
}
export function isBooleanLiteral(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.BooleanLiteral);
}
export function isOnlyBooleanLiteral(type: ts.Type): boolean {
  return isOnlyType(type, isBooleanLiteral);
}
export function hasBooleanLiteral(type: ts.Type): boolean {
  return hasType(type, isBooleanLiteral);
}
export function isBooleanish(type: ts.Type): boolean {
  return hasTypeFlag(type, ts.TypeFlags.BooleanLike);
}
export function isOnlyBooleanish(type: ts.Type): boolean {
  return isOnlyType(type, isBooleanish);
}
export function hasBooleanish(type: ts.Type): boolean {
  return hasType(type, isBooleanish);
}

export function isSymbol(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.ESSymbol);
}
export function isOnlySymbol(type: ts.Type): boolean {
  return isOnlyType(type, isSymbol);
}
export function hasSymbol(type: ts.Type): boolean {
  return hasType(type, isSymbol);
}
export function isSymbolLike(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.ESSymbolLike);
}
export function isOnlySymbolLike(type: ts.Type): boolean {
  return isOnlyType(type, isSymbolLike);
}
export function hasSymbolLike(type: ts.Type): boolean {
  return hasType(type, isSymbolLike);
}
export function isSymbolish(type: ts.Type): boolean {
  return hasTypeFlag(type, ts.TypeFlags.ESSymbolLike);
}
export function isOnlySymbolish(type: ts.Type): boolean {
  return isOnlyType(type, isSymbolish);
}
export function hasSymbolish(type: ts.Type): boolean {
  return hasType(type, isSymbolish);
}

export function isPrimitive(type: ts.Type): boolean {
  return isUndefined(type) || isNull(type) || isNumber(type) || isBoolean(type) || isString(type) || isSymbol(type);
}
export function isOnlyPrimitive(type: ts.Type): boolean {
  return isOnlyType(type, isPrimitive);
}
export function hasPrimitive(type: ts.Type): boolean {
  return hasType(type, isPrimitive);
}
export function isPrimitiveLike(type: ts.Type): boolean {
  return (
    isUndefined(type) ||
    isNull(type) ||
    isNumberLike(type) ||
    isBooleanLike(type) ||
    isStringLike(type) ||
    isSymbolLike(type)
  );
}
export function isOnlyPrimitiveLike(type: ts.Type): boolean {
  return isOnlyType(type, isPrimitiveLike);
}
export function hasPrimitiveLike(type: ts.Type): boolean {
  return hasType(type, isPrimitiveLike);
}
export function isPrimitiveish(type: ts.Type): boolean {
  return (
    isUndefined(type) ||
    isNull(type) ||
    isNumberish(type) ||
    isBooleanish(type) ||
    isStringish(type) ||
    isSymbolish(type) ||
    isVoidish(type)
  );
}
export function isOnlyPrimitiveish(type: ts.Type): boolean {
  return isOnlyType(type, isPrimitiveish);
}
export function hasPrimitiveish(type: ts.Type): boolean {
  return hasType(type, isPrimitive);
}

export function isOnlyObject(type: ts.Type): boolean {
  return isOnlyType(type, (value) => !isPrimitiveish(value));
}

export function isArray(type: ts.Type): boolean {
  const typeSymbol = getSymbol(type);
  const typeArguments = getTypeArguments(type);
  if (typeSymbol === undefined || typeArguments === undefined) {
    return false;
  }

  return (
    (symbol_.getName(typeSymbol) === 'Array' || symbol_.getName(typeSymbol) === 'ReadonlyArray') &&
    typeArguments.length === 1
  );
}
export function isOnlyArray(type: ts.Type): boolean {
  return isOnlyType(type, isArray);
}
export function hasArray(type: ts.Type): boolean {
  return hasType(type, isArray);
}
export function isArrayish(type: ts.Type): boolean {
  return isArray(type) || isTuple(type);
}
export function isOnlyArrayish(type: ts.Type): boolean {
  return isOnlyType(type, isArrayish);
}
export function hasArrayish(type: ts.Type): boolean {
  return hasType(type, isArrayish);
}

export function getArrayType(type: ts.Type): ts.Type | undefined {
  if (!isArray(type)) {
    return undefined;
  }

  const typeArguments = getTypeArgumentsOrThrow(type);

  return typeArguments[0];
}

export function getArrayTypeOrThrow(type: ts.Type): ts.Type {
  return utils.throwIfNullOrUndefined(getArrayType(type), 'array type');
}

export function getArrayTypes(type: ts.Type): ReadonlyArray<ts.Type> {
  return getTypes(type, isArray);
}

export function isVoid(type: ts.Type): boolean {
  return isTypeFlag(type, ts.TypeFlags.Void);
}
export function isOnlyVoid(type: ts.Type): boolean {
  return isOnlyType(type, isVoid);
}
export function hasVoid(type: ts.Type): boolean {
  return hasType(type, isVoid);
}
export function isVoidish(type: ts.Type): boolean {
  return isVoid(type) || isUndefined(type);
}
export function isOnlyVoidish(type: ts.Type): boolean {
  return isOnlyType(type, isVoidish);
}
export function hasVoidish(type: ts.Type): boolean {
  return hasType(type, isVoidish);
}

export function getCallSignatures(type: ts.Type): ReadonlyArray<ts.Signature> {
  return type.getCallSignatures();
}

export function getNonNullableType(type: ts.Type): ts.Type {
  return type.getNonNullableType();
}
