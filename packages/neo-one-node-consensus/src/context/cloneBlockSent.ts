import { BlockSentContext } from './BlockSentContext';
import { Context } from './Context';

export function cloneBlockSent(context: Context): BlockSentContext {
  return new BlockSentContext({
    type: context.type,
    previousHash: context.previousHash,
    blockIndex: context.blockIndex,
    viewNumber: context.viewNumber,
    myIndex: context.myIndex,
    primaryIndex: context.primaryIndex,
    expectedView: context.expectedView,
    validators: context.validators,
    blockReceivedTimeSeconds: context.blockReceivedTimeSeconds,
  });
}
