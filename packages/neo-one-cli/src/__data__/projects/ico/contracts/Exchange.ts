import {
  Address,
  constant,
  MapStorage,
  crypto,
  Integer,
  createEventNotifier,
  SmartContract,
} from '@neo-one/smart-contract';

const notifyDeposited = createEventNotifier<Address, Address, Integer>('deposited', 'address', 'assetID', 'amount');
const notifyWithdrawn = createEventNotifier<Address, Address, Integer>('withdrawn', 'address', 'assetID', 'amount');
const notifyOfferCreated = createEventNotifier<Address, Address, Integer, Address, Integer, Buffer>(
  'offerCreated',
  'makerAddress',
  'offerAssetID',
  'offerAmount',
  'wantAssetID',
  'wantAmount',
  'offerHash',
);
const notifyOfferCancelled = createEventNotifier<Buffer>('offerCancelled', 'offerHash');
// const notifyBurnt = createEventNotifier<Address, Address, Integer>(
//   'burnt',
//   'filler',
//   'takerFeeAssetID',
//   'takerFeeAmount',
// );
const notifyFilled = createEventNotifier<Address, Buffer, Integer, Address, Integer, Address, Integer, Integer>(
  'offerFilled',
  'filler',
  'offerHash',
  'amountToFill',
  'offerAssetID',
  'offerAmount',
  'wantAssetID',
  'wantAmount',
  'amountToTake',
);

interface NEP5 {
  readonly transfer: (from: Address, to: Address, amount: Integer) => boolean;
}

type Offer = {
  readonly maker: Address;
  readonly offerAssetID: Address;
  readonly offerAmount: Integer;
  readonly wantAssetID: Address;
  readonly wantAmount: Integer;
  // readonly makerFeeAssetID: Address;
  // readonly makerFeeAvailableAmount: Integer;
  readonly nonce: string;
};

const STATE_PENDING = 0x00;
const STATE_ACTIVE = 0x01;
const STATE_INACTIVE = 0x02;

// Based on the Switcheo BrokerContract: https://github.com/Switcheo/switcheo-neo
export class Exchange extends SmartContract {
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'Exchange',
  };
  private mutableInitState: typeof STATE_PENDING | typeof STATE_ACTIVE | typeof STATE_INACTIVE = STATE_PENDING;
  // private mutableFeeAddress: Address | undefined;
  private readonly balances = MapStorage.for<[Address, Address], Integer>();
  private readonly offers = MapStorage.for<Buffer, Offer>();

  public initialize(): boolean {
    if (this.mutableInitState !== STATE_PENDING) return false;

    // this.mutableFeeAddress = feeAddress;
    this.mutableInitState = STATE_ACTIVE;

    return true;
  }

  @constant
  public balanceOf(address: Address, assetID: Address): Integer {
    const balance = this.balances.get([address, assetID]);

    return balance === undefined ? 0 : balance;
  }

  @constant
  public getOffer(offerHash: Buffer): Offer | undefined {
    return this.offers.get(offerHash);
  }

  public deposit(originator: Address, assetID: Address, amount: Integer): boolean {
    if (this.receivedNEP5(originator, assetID, amount)) {
      return this.transferNEP5(originator, this.address, assetID, amount);
    }

    return false;
  }

  public withdraw(originator: Address, assetID: Address, amount: Integer): boolean {
    if (this.mutableInitState !== STATE_ACTIVE) return false;
    if (amount < 0) throw new Error(`Amount must be greater than 0: ${amount}`);
    if (!this.checkBalance(originator, assetID, amount)) throw new Error(`Insufficient balance to withdraw ${amount}`);
    if (!Address.isCaller(originator)) return false;

    this.changeBalance(originator, assetID, amount, 'decrease');
    notifyWithdrawn(originator, assetID, amount);

    return this.transferNEP5(this.address, originator, assetID, amount);
  }

  public makeOffer(
    maker: Address,
    offerAssetID: Address,
    offerAmount: Integer,
    wantAssetID: Address,
    wantAmount: Integer,
    // makerFeeAssetID: Address,
    // makerFeeAvailableAmount: Integer,
    nonce: string,
  ): boolean {
    // Check that transaction is called/signed by the maker
    if (!Address.isCaller(maker)) return false;
    // Check that the offer does not already exist
    const offerHash = this.getOfferHash(
      maker,
      offerAssetID,
      offerAmount,
      wantAssetID,
      wantAmount,
      // makerFeeAssetID,
      // makerFeeAvailableAmount,
      nonce,
    );
    if (this.getOffer(offerHash) !== undefined) return false;
    // Check that amounts > 0
    if (offerAmount <= 0 || wantAmount <= 0) return false;
    // Check that the trade is across different assets
    if (offerAssetID === wantAssetID) return false;
    // Check fees
    // if (makerFeeAvailableAmount < 0) return false;
    // Reduce available balance for the offered asset and amount
    this.changeBalance(maker, offerAssetID, offerAmount, 'decrease');
    // Reserve fees from the maker fee asset only if it is different from want asset
    // if (makerFeeAssetID !== wantAssetID && makerFeeAvailableAmount > 0) {
    //   // Reduce fees here separately as it is a different asset type
    //   this.changeBalance(maker, makerFeeAssetID, makerFeeAvailableAmount, 'decrease');
    // }
    // Add the offer to storage
    this.offers.set(offerHash, {
      maker,
      offerAssetID,
      offerAmount,
      wantAssetID,
      wantAmount,
      // makerFeeAssetID,
      // makerFeeAvailableAmount,
      nonce,
    });
    notifyOfferCreated(maker, offerAssetID, offerAmount, wantAssetID, wantAmount, offerHash);

    return true;
  }

  public fillOffer(
    filler: Address,
    offerHash: Buffer,
    amountToTake: Integer,
    // takerFeeAssetID: Address,
    // takerFeeAmount: Integer,
    // burnTakerFee: boolean,
    // makerFeeAmount: Integer,
    // burnMakerFee: boolean,
  ): boolean {
    // Check that transaction is called/signed by the filler
    if (!Address.isCaller(filler)) return false;
    // Check fees
    // if (takerFeeAmount < 0) return false;
    // if (makerFeeAmount < 0) return false;
    // Check that the offer still exists
    const offer = this.getOffer(offerHash);
    if (offer === undefined) return false;
    // Check that the filler is different from the maker
    if (filler === offer.maker) return false;
    // Check that the amount that will be taken is at least 1
    if (amountToTake < 1) return false;
    // Check that you cannot take more than available
    if (amountToTake > offer.offerAmount) return false;
    // Calculate amount we have to give the offerer (what the offerer wants)
    const amountToFill = (amountToTake * offer.wantAmount) / offer.offerAmount;
    if (amountToFill < 1) return false;
    // Check that there is enough balance to reduce for filler
    const wantAssetBalance = this.balanceOf(filler, offer.wantAssetID);
    if (wantAssetBalance < amountToFill) return false;
    // Check if we should deduct fees separately from the taker amount & there is enough balance in native fees if using native fees
    // const deductTakerFeesSeparately = takerFeeAssetID !== offer.offerAssetID;
    // const feeAssetBalance = this.balanceOf(filler, takerFeeAssetID);
    // if (deductTakerFeesSeparately && takerFeeAmount > 0 && feeAssetBalance <= takerFeeAmount) return false;
    // Check that maker fee does not exceed remaining amount that can be deducted as maker fees
    // if (offer.makerFeeAvailableAmount < makerFeeAmount) return false;
    // Check if we should deduct fees separately from the maker receiving amount
    // const deductMakerFeesSeparately = offer.makerFeeAssetID !== offer.wantAssetID;

    // Reduce balance from filler
    this.changeBalance(filler, offer.wantAssetID, amountToFill, 'decrease');
    // Move filled asset to the maker balance (reduce fees if needed)
    // const amountForMakerAfterFees = deductMakerFeesSeparately ? amountToFill : amountToFill - makerFeeAmount;
    this.changeBalance(offer.maker, offer.wantAssetID, amountToFill, 'increase');
    // Move taken asset to the taker balance
    // const amountToTakeAfterFees = deductTakerFeesSeparately ? amountToTake : amountToTake - takerFeeAmount;
    this.changeBalance(filler, offer.offerAssetID, amountToTake, 'increase');

    // Move fees
    // if (takerFeeAmount > 0) {
    // if (deductTakerFeesSeparately) {
    //   // Reduce fees here from contract balance separately as it is a different asset type
    //   this.changeBalance(filler, takerFeeAssetID, takerFeeAmount, 'decrease');
    // }
    // if (burnTakerFee) {
    //   // Emit burnt event for easier client tracking
    //   // notifyBurnt(filler, takerFeeAssetID, takerFeeAmount);
    // } else {
    // Only increase fee address balance if not burning
    // this.changeBalance(this.getFeeAddress(), takerFeeAssetID, takerFeeAmount, 'increase');
    // }
    // }
    // if (makerFeeAmount > 0) {
    //   // Reduce from available maker fees here
    //   const makerFeeAvailableAmount = offer.makerFeeAvailableAmount - makerFeeAmount;
    //   this.offers.set(offerHash, { ...offer, makerFeeAvailableAmount });

    //   if (burnMakerFee) {
    //     // Emit burnt event for easier client tracking
    //     notifyBurnt(filler, offer.makerFeeAssetID, makerFeeAmount);
    //   } else {
    //     // Only increase fee address balance if not burning
    //     this.changeBalance(this.getFeeAddress(), offer.makerFeeAssetID, makerFeeAmount, 'increase');
    //   }
    // }
    const offerAmount = offer.offerAmount - amountToTake;
    const wantAmount = offer.wantAmount - amountToFill;
    if (offerAmount === 0) {
      this.offers.delete(offerHash);
    } else {
      this.offers.set(offerHash, { ...offer, offerAmount, wantAmount });
    }
    notifyFilled(
      filler,
      offerHash,
      amountToFill,
      offer.offerAssetID,
      offer.offerAmount,
      offer.wantAssetID,
      offer.wantAmount,
      amountToTake,
    );

    return true;
  }

  public cancelOffer(maker: Address, offerHash: Buffer): boolean {
    if (!Address.isCaller(maker)) return false;

    const offer = this.getOffer(offerHash);
    if (offer === undefined) return false;

    this.changeBalance(maker, offer.offerAssetID, offer.offerAmount, 'increase');
    this.offers.delete(offerHash);
    notifyOfferCancelled(offerHash);

    return true;
  }

  private getOfferHash(
    maker: Address,
    offerAssetID: Address,
    offerAmount: Integer,
    wantAssetID: Address,
    wantAmount: Integer,
    // makerFeeAssetID: Address,
    // makerFeeAvailableAmount: Integer,
    nonce: string,
  ): Buffer {
    const offerBuffer = Buffer.concat([
      maker,
      offerAssetID,
      wantAssetID,
      // makerFeeAssetID,
      Buffer.from(
        [
          offerAmount,
          wantAmount,
          // makerFeeAvailableAmount
        ].toString(),
      ),
      Buffer.from(nonce),
    ]);

    return crypto.hash256(offerBuffer);
  }

  private checkBalance(address: Address, assetID: Address, balanceNeeded: Integer): boolean {
    const balance = this.balanceOf(address, assetID);

    if (balance < balanceNeeded) return false;

    return true;
  }

  private changeBalance(address: Address, assetID: Address, amount: Integer, direction: 'increase' | 'decrease'): void {
    const balance = this.balanceOf(address, assetID);
    const newBalance = direction === 'increase' ? balance + amount : balance - amount;
    this.balances.set([address, assetID], newBalance);
  }

  private receivedNEP5(originator: Address, assetID: Address, amount: Integer): boolean {
    // Verify that deposit is authorized
    if (!Address.isCaller(originator)) return false;
    if (this.mutableInitState !== STATE_ACTIVE) return false;

    // Check amount
    if (amount < 1) return false;

    // Update balances first
    this.changeBalance(originator, assetID, amount, 'increase');
    notifyDeposited(originator, assetID, amount);

    return true;
  }

  private transferNEP5(from: Address, to: Address, assetID: Address, amount: Integer): boolean {
    const nep5Asset = SmartContract.for<NEP5>(assetID);
    if (!nep5Asset.transfer(from, to, amount)) {
      throw new Error('Failed to transfer NEP-5 tokens!');
    }

    return true;
  }

  // private getFeeAddress(): Address {
  //   if (this.mutableFeeAddress === undefined) throw new Error('Fee Address has not been set!');

  //   return this.mutableFeeAddress;
  // }
}
