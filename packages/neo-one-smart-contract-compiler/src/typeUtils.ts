import { Type, TypeFlags } from 'ts-simple-ast';

function getType(type: undefined): undefined;
function getType(type: Type): Type;
function getType(type: Type | undefined): Type | undefined {
  if (type === undefined) {
    return undefined;
  }

  const constraint = type.getConstraint();

  return constraint === undefined ? type : constraint;
}

export const hasUnionType = (type: Type, isType: (type: Type) => boolean): boolean =>
  getType(type).isUnion() &&
  getType(type)
    .getUnionTypes()
    .some(isType);

export const hasIntersectionType = (type: Type, isType: (type: Type) => boolean): boolean =>
  getType(type).isIntersection() &&
  getType(type)
    .getIntersectionTypes()
    .some(isType);

export const hasType = (type: Type, isType: (type: Type) => boolean): boolean =>
  isType(type) || hasUnionType(type, isType) || hasIntersectionType(type, isType);

export const isOnly = (type: Type | undefined, isType: (type: Type | undefined) => boolean): boolean =>
  type !== undefined &&
  !getType(type).isNullable() &&
  (isType(type) ||
    (getType(type).isUnion() &&
      getType(type)
        .getUnionTypes()
        .every((unionType) => isOnly(unionType, isType))) ||
    (getType(type).isIntersection() &&
      getType(type)
        .getIntersectionTypes()
        .every((intersectionType) => isOnly(intersectionType, isType))));

export const isUndefined = (type?: Type): boolean => type !== undefined && getType(type).isUndefined();

export const isOnlyUndefined = (type?: Type): boolean => isOnly(type, isUndefined);

export const hasUndefined = (type: Type): boolean => hasType(type, isUndefined);

export const isNull = (type?: Type): boolean =>
  type !== undefined && (getType(type).isNull() || getType(type).isNullable());

export const isOnlyNull = (type?: Type): boolean => isOnly(type, isNull);

export const hasNull = (type: Type): boolean => hasType(type, isNull) || getType(type).isNullable();

export const isOnlyNumberLiteral = (type?: Type): boolean =>
  type !== undefined && isOnly(type, (tpe) => tpe !== undefined && tpe.isNumberLiteral());

export const isNumber = (type?: Type): boolean =>
  type !== undefined && (getType(type).isNumber() || getType(type).isNumberLiteral());

export const isOnlyNumber = (type?: Type): boolean => isOnly(type, isNumber);

export const hasNumber = (type: Type): boolean => hasType(type, isNumber);

export const isString = (type?: Type): boolean =>
  type !== undefined && (getType(type).isString() || getType(type).isStringLiteral());

export const isOnlyString = (type?: Type): boolean => isOnly(type, isString);

export const hasString = (type: Type): boolean => hasType(type, isString);

export const isBoolean = (type?: Type): boolean =>
  type !== undefined && (getType(type).isBoolean() || getType(type).isBooleanLiteral());

export const isOnlyBoolean = (type?: Type): boolean => isOnly(type, isBoolean);

export const hasBoolean = (type: Type): boolean => hasType(type, isBoolean);

const hasTypeFlag = (type: Type, flag: TypeFlags): boolean =>
  // tslint:disable-next-line
  (getType(type).compilerType.flags & flag) === flag;

export const isSymbol = (type?: Type): boolean =>
  type !== undefined && (hasTypeFlag(type, TypeFlags.ESSymbol) || hasTypeFlag(type, TypeFlags.ESSymbolLike));

export const isOnlySymbol = (type?: Type): boolean => isOnly(type, isSymbol);

export const hasSymbol = (type: Type): boolean => hasType(type, isSymbol);

export const isPrimitive = (type?: Type): boolean =>
  isUndefined(type) || isNull(type) || isString(type) || isNumber(type) || isBoolean(type) || isSymbol(type);

export const isOnlyPrimitive = (type?: Type): boolean => isOnly(type, isPrimitive);

export const hasPrimitive = (type: Type): boolean => hasType(type, isPrimitive);

export const isOnlyObject = (type?: Type): boolean => isOnly(type, (tpe) => !isPrimitive(tpe));

export const isArray = (type?: Type): type is Type => type !== undefined && getType(type).isArray();

export const isOnlyArray = (type?: Type): boolean => isOnly(type, isArray);

export const isTuple = (type?: Type): boolean => type !== undefined && getType(type).isTuple();

export const isOnlyTuple = (type?: Type): boolean => isOnly(type, isTuple);

export const isSame = (type0?: Type, type1?: Type): boolean =>
  type0 !== undefined &&
  type1 !== undefined &&
  (type0 === type1 ||
    (isOnlyBoolean(type0) && isOnlyBoolean(type1)) ||
    (isOnlyNumber(type0) && isOnlyNumber(type1)) ||
    (isOnlyString(type0) && isOnlyString(type1)));

export const isUnion = (type?: Type): boolean => type !== undefined && getType(type).isUnion();

export const isIntersection = (type?: Type): boolean => type !== undefined && getType(type).isIntersection();

export const isLiteral = (type?: Type): boolean => type !== undefined && getType(type).isLiteral();

export const isAnyType = (type?: Type): boolean => type !== undefined && hasTypeFlag(type, TypeFlags.Any);

export const isVoid = (type?: Type): boolean => type !== undefined && hasTypeFlag(type, TypeFlags.Void);
