import { Type, TypeFlags, ts } from 'ts-simple-ast';

function getType(type: undefined): undefined;
function getType(type: Type<ts.Type>): Type<ts.Type>;
function getType(type: Type<ts.Type> | undefined): Type<ts.Type> | undefined {
  if (type == null) {
    return undefined;
  }

  const constraint = type.getConstraint();
  return constraint == null ? type : constraint;
}

export const hasUnionType = (
  type: Type<ts.Type>,
  isType: (type: Type<ts.Type>) => boolean,
): boolean =>
  getType(type).isUnionType() &&
  getType(type)
    .getUnionTypes()
    .some(isType);

export const hasIntersectionType = (
  type: Type<ts.Type>,
  isType: (type: Type<ts.Type>) => boolean,
): boolean =>
  getType(type).isIntersectionType() &&
  getType(type)
    .getIntersectionTypes()
    .some(isType);

export const hasType = (
  type: Type<ts.Type>,
  isType: (type: Type<ts.Type>) => boolean,
): boolean =>
  isType(type) ||
  hasUnionType(type, isType) ||
  hasIntersectionType(type, isType);

export const isOnly = (
  type: Type<ts.Type> | undefined,
  isType: (type: Type<ts.Type> | undefined) => boolean,
): boolean =>
  type != null &&
  !getType(type).isNullable() &&
  (isType(type) ||
    (getType(type).isUnionType() &&
      getType(type)
        .getUnionTypes()
        .every((unionType) => isOnly(unionType, isType))) ||
    (getType(type).isIntersectionType() &&
      getType(type)
        .getIntersectionTypes()
        .every((intersectionType) => isOnly(intersectionType, isType))));

export const isUndefined = (type?: Type<ts.Type>): boolean =>
  type != null && getType(type).isUndefinedType();

export const isOnlyUndefined = (type?: Type<ts.Type>): boolean =>
  isOnly(type, isUndefined);

export const hasUndefined = (type: Type<ts.Type>): boolean =>
  hasType(type, isUndefined);

export const isNull = (type?: Type<ts.Type>): boolean =>
  type != null && (getType(type).isNullType() || getType(type).isNullable());

export const isOnlyNull = (type?: Type<ts.Type>): boolean =>
  isOnly(type, isNull);

export const hasNull = (type: Type<ts.Type>): boolean =>
  hasType(type, isNull) || getType(type).isNullable();

export const isOnlyNumberLiteral = (type?: Type<ts.Type>): boolean =>
  type != null &&
  isOnly(type, (tpe) => tpe != null && tpe.isNumberLiteralType());

export const isNumber = (type?: Type<ts.Type>): boolean =>
  type != null &&
  (getType(type).isNumberType() || getType(type).isNumberLiteralType());

export const isOnlyNumber = (type?: Type<ts.Type>): boolean =>
  isOnly(type, isNumber);

export const hasNumber = (type: Type<ts.Type>): boolean =>
  hasType(type, isNumber);

export const isString = (type?: Type<ts.Type>): boolean =>
  type != null &&
  (getType(type).isStringType() || getType(type).isStringLiteralType());

export const isOnlyString = (type?: Type<ts.Type>): boolean =>
  isOnly(type, isString);

export const hasString = (type: Type<ts.Type>): boolean =>
  hasType(type, isString);

export const isBoolean = (type?: Type<ts.Type>): boolean =>
  type != null &&
  (getType(type).isBooleanType() || getType(type).isBooleanLiteralType());

export const isOnlyBoolean = (type?: Type<ts.Type>): boolean =>
  isOnly(type, isBoolean);

export const hasBoolean = (type: Type<ts.Type>): boolean =>
  hasType(type, isBoolean);

const hasTypeFlag = (type: Type<ts.Type>, flag: TypeFlags): boolean =>
  // tslint:disable-next-line
  (getType(type).compilerType.flags & flag) === flag;

export const isSymbol = (type?: Type<ts.Type>): boolean =>
  type != null &&
  (hasTypeFlag(type, TypeFlags.ESSymbol) ||
    hasTypeFlag(type, TypeFlags.ESSymbolLike));

export const isOnlySymbol = (type?: Type<ts.Type>): boolean =>
  isOnly(type, isSymbol);

export const hasSymbol = (type: Type<ts.Type>): boolean =>
  hasType(type, isSymbol);

export const isPrimitive = (type?: Type<ts.Type>): boolean =>
  isUndefined(type) ||
  isNull(type) ||
  isString(type) ||
  isNumber(type) ||
  isBoolean(type) ||
  isSymbol(type);

export const isOnlyPrimitive = (type?: Type<ts.Type>): boolean =>
  isOnly(type, isPrimitive);

export const hasPrimitive = (type: Type<ts.Type>): boolean =>
  hasType(type, isPrimitive);

export const isOnlyObject = (type?: Type<ts.Type>): boolean =>
  isOnly(type, (tpe) => !isPrimitive(tpe));

export const isArray = (type?: Type<ts.Type>): boolean =>
  type != null && getType(type).isArrayType();

export const isOnlyArray = (type?: Type<ts.Type>): boolean =>
  isOnly(type, isArray);

export const isTuple = (type?: Type<ts.Type>): boolean =>
  type != null && getType(type).isTupleType();

export const isOnlyTuple = (type?: Type<ts.Type>): boolean =>
  isOnly(type, isTuple);

export const isSame = (type0?: Type<ts.Type>, type1?: Type<ts.Type>): boolean =>
  type0 != null &&
  type1 != null &&
  (type0 === type1 ||
    (isOnlyBoolean(type0) && isOnlyBoolean(type1)) ||
    (isOnlyNumber(type0) && isOnlyNumber(type1)) ||
    (isOnlyString(type0) && isOnlyString(type1)));

export const isUnion = (type?: Type<ts.Type>): boolean =>
  type != null && getType(type).isUnionType();

export const isIntersection = (type?: Type<ts.Type>): boolean =>
  type != null && getType(type).isIntersectionType();

export const isLiteral = (type?: Type): boolean =>
  type != null && getType(type).isLiteralType();

export const isAnyType = (type?: Type): boolean =>
  type != null && hasTypeFlag(type, TypeFlags.Any);

export const isVoid = (type?: Type): boolean =>
  type != null && hasTypeFlag(type, TypeFlags.Void);
