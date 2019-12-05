import {
  Address,
  constant,
  Deploy,
  Hash256,
  MapStorage,
  crypto,
  Fixed8,
  createEventNotifier,
  SmartContract,
} from '@neo-one/smart-contract';

const notifyDeposited = createEventNotifier<Address, Address, Fixed8>('deposited', 'address', 'assetID', 'amount');
const notifyWithdrawn = createEventNotifier<Address, Address, Fixed8>('withdrawn', 'address', 'assetID', 'amount');
const notifyOfferCreated = createEventNotifier<Address, Address, Fixed8, Address, Fixed8, Hash256>(
  'offerCreated',
  'makerAddress',
  'offerAssetID',
  'offerAmount',
  'wantAssetID',
  'wantAmount',
  'offerHash',
);
const notifyOfferCancelled = createEventNotifier<Hash256>('offerCancelled', 'offerHash');
const notifyBurnt = createEventNotifier<Address, Address, Fixed8>(
  'burnt',
  'filler',
  'takerFeeAssetID',
  'takerFeeAmount',
);
const notifyFilled = createEventNotifier<Address, Hash256, Fixed8, Address, Fixed8, Address, Fixed8, Fixed8>(
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
  readonly transfer: (from: Address, to: Address, amount: Fixed8) => boolean;
}

type Offer = {
  readonly maker: Address;
  readonly offerAssetID: Address;
  readonly offerAmount: Fixed8;
  readonly wantAssetID: Address;
  readonly wantAmount: Fixed8;
  readonly makerFeeAssetID: Address;
  readonly makerFeeAvailableAmount: Fixed8;
  readonly nonce: string;
};

// Based on the Switcheo BrokerContract: https://github.com/Switcheo/switcheo-neo
export class Exchange extends SmartContract {
  private mutableFeeAddress: Address;
  private readonly balances = MapStorage.for<[Address, Address], Fixed8>();
  private readonly offers = MapStorage.for<Hash256, Offer>();

  public constructor(public readonly owner: Address = Deploy.senderAddress) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.mutableFeeAddress = this.address;
  }

  @constant
  public balanceOf(address: Address, assetID: Address): Fixed8 {
    const balance = this.balances.get([address, assetID]);

    return balance === undefined ? 0 : balance;
  }

  @constant
  public getOffer(offerHash: Hash256): Offer | undefined {
    return this.offers.get(offerHash);
  }

  public depositNEP5(from: Address, assetID: Address, amount: Fixed8): void {
    if (!Address.isCaller(from)) throw new Error('Caller was not the sender!');
    if (amount < 1) throw new Error('Amount must be greater than 0!');

    this.transferNEP5(from, this.address, assetID, amount);
    this.balances.set([from, assetID], this.balanceOf(from, assetID) + amount);
    notifyDeposited(from, assetID, amount);
  }

  public withdrawNEP5(from: Address, assetID: Address, amount: Fixed8): void {
    if (amount < 0) throw new Error(`Amount must be greater than 0: ${amount}`);
    const balance = this.balanceOf(from, assetID);
    if (balance < amount) throw new Error(`Not enough Balance to withdraw ${amount}!`);
    if (!Address.isCaller(from)) throw new Error('Caller is not authorized to withdraw funds!');

    this.transferNEP5(this.address, from, assetID, amount);
    this.balances.set([from, assetID], this.balanceOf(from, assetID) - amount);
    notifyWithdrawn(from, assetID, amount);
  }

  public makeOffer(
    maker: Address,
    offerAssetID: Address,
    offerAmount: Fixed8,
    wantAssetID: Address,
    wantAmount: Fixed8,
    makerFeeAssetID: Address,
    makerFeeAvailableAmount: Fixed8,
    nonce: string,
  ): void {
    // Check that transaction is called/signed by the maker
    if (!Address.isCaller(maker)) throw new Error('Caller is not authorized to make an offer on behalf of the maker!');
    // Check that the offer does not already exist
    const offerHash = this.getOfferHash(
      maker,
      offerAssetID,
      offerAmount,
      wantAssetID,
      wantAmount,
      makerFeeAssetID,
      makerFeeAvailableAmount,
      nonce,
    );
    if (this.getOffer(offerHash) !== undefined) throw new Error('Offer does not exist!');
    // Check that amounts > 0
    if (offerAmount <= 0 || wantAmount <= 0) throw new Error('Invalid amount. All amounts must be > 0!');
    // Check that the trade is across different assets
    if (offerAssetID === wantAssetID) throw new Error('Cannot make an offer for the same asset!');
    // Check fees
    if (makerFeeAvailableAmount < 0) throw new Error('Fee available amount cannot be < 0!');
    // Reduce available balance for the offered asset and amount
    this.balances.set([maker, offerAssetID], this.balanceOf(maker, offerAssetID) - offerAmount);
    // Reserve fees from the maker fee asset only if it is different from want asset
    if (makerFeeAssetID !== wantAssetID && makerFeeAvailableAmount > 0) {
      // Reduce fees here separately as it is a different asset type
      this.balances.set([maker, makerFeeAssetID], this.balanceOf(maker, makerFeeAssetID) - makerFeeAvailableAmount);
    }
    // Add the offer to storage
    this.offers.set(offerHash, {
      maker,
      offerAssetID,
      offerAmount,
      wantAssetID,
      wantAmount,
      makerFeeAssetID,
      makerFeeAvailableAmount,
      nonce,
    });
    notifyOfferCreated(maker, offerAssetID, offerAmount, wantAssetID, wantAmount, offerHash);
  }

  // Currently above the 10 GAS limit.
  public fillOffer(
    filler: Address,
    offerHash: Hash256,
    amountToTake: Fixed8,
    takerFeeAssetID: Address,
    takerFeeAmount: Fixed8,
    burnTakerFee: boolean,
    makerFeeAmount: Fixed8,
    burnMakerFee: boolean,
  ): void {
    // Check that transaction is called/signed by the filler
    if (!Address.isCaller(filler)) throw new Error('Caller is not authorized to fill offer on behalf of the filler!');
    // Check fees
    if (takerFeeAmount < 0) throw new Error('takerFeeAmount must not be < 0!');
    if (makerFeeAmount < 0) throw new Error('makerFeeAmount must not be < 0!');
    // Check that the offer still exists
    const offer = this.getOffer(offerHash);
    if (offer === undefined) throw new Error('Offer does not exist!');
    // Check that the filler is different from the maker
    if (filler === offer.maker) throw new Error('Filler cannot be the same as the maker!');
    // Check that the amount that will be taken is at least 1
    if (amountToTake < 1) throw new Error('Filler must take a nonzero amount of the offered asset!');
    // Check that you cannot take more than available
    if (amountToTake > offer.offerAmount) throw new Error('Filler requests more than available in offer!');
    // Calculate amount we have to give the offerer (what the offerer wants)
    const amountToFill = (amountToTake * offer.wantAmount) / offer.offerAmount;
    if (amountToFill < 1) throw new Error('Must fill a nonzero amount of the offered asset!');
    // Check that there is enough balance to reduce for filler
    const wantAssetBalance = this.balanceOf(filler, offer.wantAssetID);
    if (wantAssetBalance < amountToFill) throw new Error('Not enough balance to fill offer!');
    // Check if we should deduct fees separately from the taker amount & there is enough balance in native fees if using native fees
    const deductTakerFeesSeparately = takerFeeAssetID !== offer.offerAssetID;
    const feeAssetBalance = this.balanceOf(filler, takerFeeAssetID);
    if (deductTakerFeesSeparately && takerFeeAmount > 0 && feeAssetBalance <= takerFeeAmount) {
      throw new Error('Filler does not have enough balance for fee!');
    }
    // Check that maker fee does not exceed remaining amount that can be deducted as maker fees
    if (offer.makerFeeAvailableAmount < makerFeeAmount) throw new Error('Maker does not have enough balance for fee!');
    // Check if we should deduct fees separately from the maker receiving amount
    const deductMakerFeesSeparately = offer.makerFeeAssetID !== offer.wantAssetID;

    // Reduce balance from filler
    this.balances.set([filler, offer.wantAssetID], this.balanceOf(filler, offer.wantAssetID) - amountToFill);
    // Move filled asset to the maker balance (reduce fees if needed)
    const amountForMakerAfterFees = deductMakerFeesSeparately ? amountToFill : amountToFill - makerFeeAmount;
    this.balances.set(
      [offer.maker, offer.wantAssetID],
      this.balanceOf(offer.maker, offer.wantAssetID) + amountForMakerAfterFees,
    );
    // Move taken asset to the taker balance
    const amountToTakeAfterFees = deductTakerFeesSeparately ? amountToTake : amountToTake - takerFeeAmount;
    this.balances.set([filler, offer.offerAssetID], this.balanceOf(filler, offer.offerAssetID) + amountToTakeAfterFees);

    // Move fees
    if (takerFeeAmount > 0) {
      if (deductTakerFeesSeparately) {
        // Reduce fees here from contract balance separately as it is a different asset type
        this.balances.set([filler, takerFeeAssetID], this.balanceOf(filler, takerFeeAssetID) - takerFeeAmount);
      }
      if (burnTakerFee) {
        // Emit burnt event for easier client tracking
        notifyBurnt(filler, takerFeeAssetID, takerFeeAmount);
      } else {
        // Only increase fee address balance if not burning
        this.balances.set(
          [this.feeAddress, takerFeeAssetID],
          this.balanceOf(this.feeAddress, takerFeeAssetID) + takerFeeAmount,
        );
      }
    }
    let makerFeeAvailableAmount = offer.makerFeeAvailableAmount;
    if (makerFeeAmount > 0) {
      // Reduce from available maker fees here
      makerFeeAvailableAmount = offer.makerFeeAvailableAmount - makerFeeAmount;

      if (burnMakerFee) {
        // Emit burnt event for easier client tracking
        notifyBurnt(offer.maker, offer.makerFeeAssetID, makerFeeAmount);
      } else {
        // Only increase fee address balance if not burning
        this.balances.set(
          [this.feeAddress, offer.makerFeeAssetID],
          this.balanceOf(this.feeAddress, offer.makerFeeAssetID) + makerFeeAmount,
        );
      }
    }

    const offerAmount = offer.offerAmount - amountToTake;
    const wantAmount = offer.wantAmount - amountToFill;
    if (offerAmount === 0) {
      this.offers.delete(offerHash);
    } else {
      this.offers.set(offerHash, { ...offer, offerAmount, wantAmount, makerFeeAvailableAmount });
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
  }

  public cancelOffer(maker: Address, offerHash: Hash256): void {
    if (!Address.isCaller(maker)) throw new Error('Only the offer maker may cancel an offer!');

    const offer = this.getOffer(offerHash);
    if (offer === undefined) throw new Error('Offer does not exist!');

    this.balances.set([maker, offer.offerAssetID], this.balanceOf(maker, offer.offerAssetID) + offer.offerAmount);
    this.balances.set(
      [maker, offer.makerFeeAssetID],
      this.balanceOf(maker, offer.makerFeeAssetID) + offer.makerFeeAvailableAmount,
    );
    this.offers.delete(offerHash);
    notifyOfferCancelled(offerHash);
  }

  public set feeAddress(address: Address) {
    if (!Address.isCaller(this.owner)) {
      throw new Error('Only the contract owner can change the FeeAddress!');
    }

    this.mutableFeeAddress = address;
  }

  @constant
  public get feeAddress(): Address {
    return this.mutableFeeAddress;
  }

  private getOfferHash(
    maker: Address,
    offerAssetID: Address,
    offerAmount: Fixed8,
    wantAssetID: Address,
    wantAmount: Fixed8,
    makerFeeAssetID: Address,
    makerFeeAvailableAmount: Fixed8,
    nonce: string,
  ): Hash256 {
    const offerBuffer = Buffer.concat([
      maker,
      offerAssetID,
      wantAssetID,
      makerFeeAssetID,
      Buffer.from([offerAmount, wantAmount, makerFeeAvailableAmount].toString()),
      Buffer.from(nonce),
    ]);

    return crypto.hash256(offerBuffer);
  }

  private transferNEP5(from: Address, to: Address, assetID: Address, amount: Fixed8): void {
    const nep5Asset = SmartContract.for<NEP5>(assetID);
    if (!nep5Asset.transfer(from, to, amount)) {
      throw new Error('Failed to transfer NEP-5 tokens!');
    }
  }
}
