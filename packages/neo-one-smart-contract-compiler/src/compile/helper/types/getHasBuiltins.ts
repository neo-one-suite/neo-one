import ts from 'typescript';
import { Context } from '../../../Context';
import { hasAccount } from './account';
import { hasArray } from './array';
import { hasAsset } from './asset';
import { hasAttribute } from './attribute';
import { hasBlock } from './block';
import { hasBuffer } from './buffer';
import { hasContract } from './contract';
import { hasHeader } from './header';
import { hasInput } from './input';
import { hasOutput } from './output';
import { hasTransaction } from './transaction';

type HasBuiltin = (context: Context, arg: ts.Node, argType: ts.Type) => boolean;

const hasBuiltins: ReadonlyArray<HasBuiltin> = [
  hasArray,
  hasAttribute,
  hasBuffer,
  hasInput,
  hasOutput,
  hasTransaction,
  hasAccount,
  hasAsset,
  hasBlock,
  hasContract,
  hasHeader,
];

export function getHasBuiltins(context: Context, node: ts.Node, type: ts.Type): ReadonlyArray<HasBuiltin> {
  return hasBuiltins.filter((hasBuiltin) => hasBuiltin(context, node, type));
}
