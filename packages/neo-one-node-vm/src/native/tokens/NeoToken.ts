import { common } from '@neo-one/client-common';
import { ContractParameterType } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { ExecutionContext, FEES, OpInvokeArgs } from '../../constants';
import { ValueNegativeError } from '../../errors';
import { IntegerStackItem, StringStackItem } from '../../stackItem';
import { ContractMethodData, createStorageKey, NativeContractBase } from '../NativeContractBase';
import { Nep5Token } from './Nep5Token';

// TODO: Finish + add Validators & Voting

export const NEO_METHODS: readonly ContractMethodData[] = [];

const calculateBonus = (context: ExecutionContext, value: BN, start: BN, end: BN): BN => {
  if (value.isZero() || start.gte(end)) {
    return new BN(0);
  }
  if (value.isNeg()) {
    throw new ValueNegativeError(context, value);
  }

  // TODO: Finish
  return value;
};

export class NeoToken extends Nep5Token {
  public static readonly prefixValidator = Buffer.from([0x33]);
  public static readonly prefixValidatorCount = Buffer.from([0x15]);
  public static readonly prefixNextValidator = Buffer.from([0x14]);

  public constructor() {
    super({
      methods: NEO_METHODS,
      // TODO: Update this based on neo-project
      onBalanceChange: () => {
        // do nothing
      },
      serviceName: 'Neo.Native.Tokens.NEO',
      name: 'NEO',
      symbol: 'neo',
      decimals: new BN(0),
    });
  }

  public async initialize(context: ExecutionContext): Promise<boolean> {
    if (!this.initializeBase(context)) {
      return false;
    }
    const storageItem = await context.blockchain.storageItem.tryGet(
      createStorageKey(this.hash, Nep5Token.prefixTotalSupply),
    );
    if (storageItem === undefined) {
      return true;
    }

    // TODO: Fix this part
    const account = common.bufferToUInt160(Buffer.alloc(3, 20));

    await this.mint(context, account, new BN(30_000_000).mul(this.factor));

    // TODO: Register Validators
    return true;
  }

  public onPersist(_context: ExecutionContext) {
    // TODO: Finish
    return true;
  }
}
