import { BlockSentContext } from './BlockSentContext';
import { Context } from './Context';
import { InitialContext } from './InitialContext';

// tslint:disable-next-line no-object-mutation no-unused
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
}): InitialContext {
  return new InitialContext({
    type,
    previousHash: previousHash === undefined ? this.previousHash : previousHash,
    blockIndex: blockIndex === undefined ? this.blockIndex : blockIndex,
    viewNumber,
    myIndex: myIndex === undefined ? this.myIndex : myIndex,
    primaryIndex,
    expectedView: expectedView === undefined ? this.expectedView : expectedView,
    validators: validators === undefined ? this.validators : validators,
    blockReceivedTimeSeconds:
      blockReceivedTimeSeconds === undefined ? this.blockReceivedTimeSeconds : blockReceivedTimeSeconds,
  });
};

// tslint:disable-next-line no-object-mutation no-unused
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
export * from './BlockSentContext';
export * from './HeaderContext';
export * from './InitialContext';
export * from './RequestReceivedContext';
export * from './RequestSentContext';
export * from './SignatureSentContext';
export * from './ViewChangingContext';
export * from './types';
