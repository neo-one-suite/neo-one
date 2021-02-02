import ts from 'typescript';
import { Context } from '../../../Context';
import { hasArray } from './array';
import { hasAttribute } from './attribute';
import { hasBlock } from './block';
import { hasBuffer } from './buffer';
import { hasContract } from './contract';
import { hasTransaction } from './transaction';

type HasBuiltin = (context: Context, arg: ts.Node, argType: ts.Type) => boolean;

const hasBuiltins: ReadonlyArray<HasBuiltin> = [
  hasArray,
  hasAttribute,
  hasBuffer,
  hasTransaction,
  hasBlock,
  hasContract,
];

export function getHasBuiltins(context: Context, node: ts.Node, type: ts.Type): ReadonlyArray<HasBuiltin> {
  return hasBuiltins.filter((hasBuiltin) => hasBuiltin(context, node, type));
}
