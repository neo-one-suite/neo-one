import { common } from '@neo-one/client-common';
import { ContractParameterDeclaration, ContractParameterType } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { ExecutionContext, FEES, OpInvokeArgs } from '../../constants';
import { IntegerStackItem } from '../../stackItem';
import { ContractMethodData, createStorageKey, NativeContractBase } from '../NativeContractBase';
import { Nep5Token } from './Nep5Token';

export const GAS_METHODS: readonly ContractMethodData[] = [
  {
    name: 'getSysFeeAmount',
    price: FEES[0],
    returnType: ContractParameterType.String,
    parameters: [new ContractParameterDeclaration({ type: ContractParameterType.Integer, name: 'index' })],
    safeMethod: true,
    delegate: (contract: NativeContractBase) => async ({ context, args }: OpInvokeArgs) => {
      const index = args[0].asBigInteger();
      if (index.eq(new BN(0))) {
        // TODO: handle genesis block?
      }

      const key = createStorageKey(contract.hash, GasToken.prefixSystemFeeAmount, args[0].asBuffer());
      const storageItem = await context.blockchain.storageItem.tryGet(key);

      return storageItem === undefined
        ? new IntegerStackItem(new BN(0))
        : new IntegerStackItem(new BN(storageItem.value));
    },
  },
];

export class GasToken extends Nep5Token {
  public static readonly prefixSystemFeeAmount = Buffer.from([0x15]);

  public constructor() {
    super({
      methods: GAS_METHODS,
      // TODO: Check this on neo-project
      onBalanceChange: () => {
        // do nothing
      },
      serviceName: 'Neo.Native.Tokens.GAS',
      name: 'GAS',
      symbol: 'gas',
      decimals: new BN(8),
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

    return true;
  }

  public onPersist(context: ExecutionContext) {
    context.blockchain.currentBlock.transactions.forEach((transaction) =>
      this.burn(context, transaction.sender, transaction.systemFee.add(transaction.networkFee)),
    );

    // TODO: Finish
    return true;
  }
}
