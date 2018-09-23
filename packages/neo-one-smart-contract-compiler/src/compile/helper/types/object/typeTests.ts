import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';
import { isArray } from '../array';
import { isArrayStorage } from '../arrayStorage';
import { isAttribute } from '../attribute';
import { isBoolean } from '../boolean';
import { isBuffer } from '../buffer';
import { isError } from '../error';
import { isForwardValue } from '../forwardValue';
import { isInput } from '../input';
import { isIterable } from '../iterable';
import { isIterableIterator } from '../iterableIterator';
import { isIteratorResult } from '../iteratorResult';
import { isMap } from '../map';
import { isMapStorage } from '../mapStorage';
import { isNull } from '../null';
import { isNumber } from '../number';
import { isOutput } from '../output';
import { isSet } from '../set';
import { isSetStorage } from '../setStorage';
import { isString } from '../string';
import { isSymbol } from '../symbol';
import { isTransaction } from '../transaction';
import { isUndefined } from '../undefined';

export const hasObject = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isObject(context, node, tpe));

export const isOnlyObject = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isObject(context, node, tpe));

export const isObject = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  !tsUtils.type_.isUnion(type) &&
  !tsUtils.type_.isIntersection(type) &&
  !isUndefined(context, node, type) &&
  !isNull(context, node, type) &&
  !isBoolean(context, node, type) &&
  !isNumber(context, node, type) &&
  !isString(context, node, type) &&
  !isSymbol(context, node, type) &&
  !isBuffer(context, node, type) &&
  !isArray(context, node, type) &&
  !isArrayStorage(context, node, type) &&
  !isMap(context, node, type) &&
  !isMapStorage(context, node, type) &&
  !isSet(context, node, type) &&
  !isSetStorage(context, node, type) &&
  !isError(context, node, type) &&
  !isForwardValue(context, node, type) &&
  !isIteratorResult(context, node, type) &&
  !isIterable(context, node, type) &&
  !isIterableIterator(context, node, type) &&
  !isTransaction(context, node, type) &&
  !isOutput(context, node, type) &&
  !isAttribute(context, node, type) &&
  !isInput(context, node, type);
