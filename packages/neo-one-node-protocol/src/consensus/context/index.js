/* @flow */
import { type ECPoint, type UInt256 } from '@neo-one/client-core';

import type { Type } from './types';

import BlockSentContext from './BlockSentContext';
import Context from './Context';
import InitialContext from './InitialContext';

// $FlowFixMe
Context.prototype.cloneInitial = function cloneInitial({
  type,
  previousHash,
  blockIndex,
  viewNumber,
  myIndex,
  primaryIndex,
  expectedView,
  validators,
  blockReceivedTimeSeconds,
}: {|
  type: Type,
  previousHash?: UInt256,
  blockIndex?: number,
  viewNumber: number,
  myIndex?: number,
  primaryIndex: number,
  expectedView?: Array<number>,
  validators?: Array<ECPoint>,
  blockReceivedTimeSeconds?: number,
|}): InitialContext {
  return new InitialContext({
    type,
    previousHash: previousHash == null ? this.previousHash : previousHash,
    blockIndex: blockIndex == null ? this.blockIndex : blockIndex,
    viewNumber,
    myIndex: myIndex == null ? this.myIndex : myIndex,
    primaryIndex,
    expectedView: expectedView == null ? this.expectedView : expectedView,
    validators: validators == null ? this.validators : validators,
    blockReceivedTimeSeconds:
      blockReceivedTimeSeconds == null
        ? this.blockReceivedTimeSeconds
        : blockReceivedTimeSeconds,
  });
};

// $FlowFixMe
Context.prototype.cloneBlockSent = function cloneBlockSent(): BlockSentContext {
  return new BlockSentContext({
    type: this.type,
    previousHash: this.previousHash,
    blockIndex: this.blockIndex,
    viewNumber: this.viewNumber,
    myIndex: this.myIndex,
    primaryIndex: this.primaryIndex,
    expectedView: this.expectedView,
    validators: this.validators,
    blockReceivedTimeSeconds: this.blockReceivedTimeSeconds,
  });
};

export { Context };
export { default as BlockSentContext } from './BlockSentContext';
export { default as HeaderContext } from './HeaderContext';
export { default as InitialContext } from './InitialContext';
export { default as RequestReceivedContext } from './RequestReceivedContext';
export { default as RequestSentContext } from './RequestSentContext';
export { default as SignatureSentContext } from './SignatureSentContext';
export { default as ViewChangingContext } from './ViewChangingContext';

export type { Type } from './types';
