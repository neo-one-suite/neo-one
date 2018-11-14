import { ECPoint, UInt256 } from '@neo-one/client-common';
import { Context } from './Context';
import { InitialContext } from './InitialContext';
import { Type } from './types';

export function cloneInitial(
  context: Context,
  {
    type,
    previousHash,
    blockIndex,
    viewNumber,
    myIndex,
    primaryIndex,
    expectedView,
    validators,
    blockReceivedTimeSeconds,
  }: {
    readonly type: Type;
    readonly previousHash?: UInt256;
    readonly blockIndex?: number;
    readonly viewNumber: number;
    readonly myIndex?: number;
    readonly primaryIndex: number;
    readonly expectedView?: ReadonlyArray<number>;
    readonly validators?: ReadonlyArray<ECPoint>;
    readonly blockReceivedTimeSeconds?: number;
  },
): InitialContext {
  return new InitialContext({
    type,
    previousHash: previousHash === undefined ? context.previousHash : previousHash,
    blockIndex: blockIndex === undefined ? context.blockIndex : blockIndex,
    viewNumber,
    myIndex: myIndex === undefined ? context.myIndex : myIndex,
    primaryIndex,
    expectedView: expectedView === undefined ? context.expectedView : expectedView,
    validators: validators === undefined ? context.validators : validators,
    blockReceivedTimeSeconds:
      blockReceivedTimeSeconds === undefined ? context.blockReceivedTimeSeconds : blockReceivedTimeSeconds,
  });
}
