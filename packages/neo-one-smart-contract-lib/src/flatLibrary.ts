import {
  Address,
  ArrayStorage,
  Blockchain,
  createEventNotifier,
  Fixed,
  MapStorage,
  SerializableValue,
  SerializableValueArray,
  SmartContract,
} from '@neo-one/smart-contract';
import { NEP5Token } from './';

/* tslint:disable-next-line: no-let*/
let mutableConfig = {};

// ACCOUNTING: Tracking the Token Balances
type BalanceStore = MapStorage<Address, Fixed<8>>;

/*
This implementation throws a TS2322 on the forEach() line...
  Type 'Args' is not assignable to type 'Iterable<A | B | C | D | E>'.
  Property '[one0]' is missing in type '[A, B, C, D, E]' but required in type 'Iterable<A | B | C | D | E>'.
*/
/* tslint:disable-next-line:readonly-array*/
type CommonArgs = SerializableValue[];

interface EventRegister {
  /*tslint:disable-next-line:readonly-array */
  readonly [K: string]: Array<(...args: CommonArgs) => void>;
}
/* tslint:disable-next-line: no-let*/
const mutableEventRegister: EventRegister = {};
function fireEvent<Args extends [A], A extends SerializableValue>(event: string, args: Args): void;
function fireEvent<Args extends [A, B], A extends SerializableValue, B extends SerializableValue>(
  event: string,
  args: Args,
): void;
function fireEvent<
  Args extends [A, B, C],
  A extends SerializableValue,
  B extends SerializableValue,
  C extends SerializableValue
>(event: string, args: Args): void;
function fireEvent<
  Args extends [A, B, C, D],
  A extends SerializableValue,
  B extends SerializableValue,
  C extends SerializableValue,
  D extends SerializableValue
>(event: string, args: Args): void;
function fireEvent<
  Args extends [A, B, C, D, E],
  A extends SerializableValue,
  B extends SerializableValue,
  C extends SerializableValue,
  D extends SerializableValue,
  E extends SerializableValue
>(event: string, args: Args): void {
  if (mutableEventRegister[event] && mutableEventRegister[event].length) {
    mutableEventRegister[event].forEach((callback) => {
      callback(...args);
    });
  }
}
function registerListener<Args extends [A], A extends SerializableValue>(
  event: string,
  callback: (...args: Args) => void,
): void;
function registerListener<Args extends [A, B], A extends SerializableValue, B extends SerializableValue>(
  event: string,
  callback: (...args: Args) => void,
): void;
function registerListener<
  Args extends [A, B, C],
  A extends SerializableValue,
  B extends SerializableValue,
  C extends SerializableValue
>(event: string, callback: (...args: Args) => void): void;
function registerListener<
  Args extends [A, B, C, D],
  A extends SerializableValue,
  B extends SerializableValue,
  C extends SerializableValue,
  D extends SerializableValue
>(event: string, callback: (...args: Args) => void): void;
function registerListener<
  Args extends [A, B, C, D, E],
  A extends SerializableValue,
  B extends SerializableValue,
  C extends SerializableValue,
  D extends SerializableValue,
  E extends SerializableValue
>(event: string, callback: (...args: Args) => void): void {
  mutableEventRegister[event].push((...args: Args) => {
    callback(...args);
  });
}

/*
  BEGIN EVENT REGISTER EXAMPLE
  ------------------------------------- */
// tslint:disable-next-line: readonly-array
type PreCheckArgsType = [Address, Fixed<8>];
const exampleHandler = (a: Address, howmuch: Fixed<8>) => {
  if (!Address.isCaller(a) || howmuch <= 0) {
    notify_of_error();
    throw new Error(' Nope, Roll back!');
  }
};
const myAddress = Address.from('Something');
registerListener<PreCheckArgsType, Address, Fixed<8>>('BuyPrecheck', exampleHandler);
fireEvent<PreCheckArgsType, Address, Fixed<8>>('BuyPrecheck', [myAddress, 123]);
/* -------------------------------------
END EVENT REGISTER EXAMPLE
*/

const notify_of_error = createEventNotifier("Foobar'd");

/* ====================================================
   ====================================================
              PERMISSIONS
   ====================================================
   ==================================================== */

// A DATA STORE FOR ANy GIVEN ROLE LOOKS LIKE:
type AccessRoleStore = MapStorage<Address, boolean>;

/* ------------------------------
      ROLE: CAPPER
   ------------------------------ */
/* tslint:disable-next-line:variable-name */
const added_capper = createEventNotifier<Address, Address>('capper added', 'account', 'requested by');
/* tslint:disable-next-line:variable-name */
const remove_capper = createEventNotifier<Address, Address>('capper removed', 'account', 'requested by');

/* tslint:disable-next-line:no-let*/
let mutableInitializedCapper = false;

const isCapper = (dataStore: AccessRoleStore, account: Address) => dataStore.has(account) && dataStore.get(account);
const addCapper = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isCapper(dataStore, requestedBy) && !isCapper(dataStore, account)) {
    dataStore.set(account, true);
    added_capper(account, requestedBy);
  }
};
const revokeCapper = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isCapper(dataStore, requestedBy) && isCapper(dataStore, account) && account !== requestedBy) {
    dataStore.set(account, false);
    remove_capper(account, requestedBy);
  }
};
const firstCapper = (dataStore: AccessRoleStore, account: Address): boolean => {
  if (mutableInitializedCapper) {
    mutableInitializedCapper = true;
    dataStore.set(account, true);

    return true;
  }

  return false;
};
const onlyCappers = (dataStore: AccessRoleStore, account: Address) => {
  if (!isCapper(dataStore, account)) {
    throw new Error(' request denied ');
  }
};

/* ------------------------------
      ROLE: MINTER
   ------------------------------ */
/* tslint:disable-next-line:variable-name */
const added_minter = createEventNotifier<Address, Address>('minter added', 'account', 'requested by');
/* tslint:disable-next-line:variable-name */
const remove_minter = createEventNotifier<Address, Address>('minter removed', 'account', 'requested by');
/* tslint:disable-next-line:no-let*/
let mutableInitializedMinter = false;
const isMinter = (dataStore: AccessRoleStore, account: Address) => dataStore.has(account) && dataStore.get(account);

const addMinter = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isMinter(dataStore, requestedBy) && !isMinter(dataStore, account)) {
    dataStore.set(account, true);
    added_minter(account, requestedBy);
  }
};
const revokeMinter = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isMinter(dataStore, requestedBy) && isMinter(dataStore, account) && account !== requestedBy) {
    dataStore.set(account, false);
    remove_minter(account, requestedBy);
  }
};
const firstMinter = (dataStore: AccessRoleStore, account: Address): boolean => {
  if (mutableInitializedMinter) {
    mutableInitializedMinter = true;
    dataStore.set(account, true);

    return true;
  }

  return false;
};
const onlyMinters = (dataStore: AccessRoleStore, account: Address) => {
  if (!isMinter(dataStore, account)) {
    throw new Error(' request denied ');
  }
};

/* ------------------------------
      ROLE: SIGNER
------------------------------ */
const added_signer = createEventNotifier<Address, Address>('signer added', 'account', 'requested by');
const remove_signer = createEventNotifier<Address, Address>('signer removed', 'account', 'requested by');
/* tslint:disable-next-line:no-let*/
let mutableInitializedSigner = false;

const isSigner = (dataStore: AccessRoleStore, account: Address) => dataStore.has(account) && dataStore.get(account);

const addSigner = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isSigner(dataStore, requestedBy) && !isSigner(dataStore, account)) {
    dataStore.set(account, true);
    added_signer(account, requestedBy);
  }
};
const revokeSigner = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isSigner(dataStore, requestedBy) && isSigner(dataStore, account) && account !== requestedBy) {
    dataStore.set(account, false);
    remove_signer(account, requestedBy);
  }
};
const firstSigner = (dataStore: AccessRoleStore, account: Address): boolean => {
  if (mutableInitializedSigner) {
    mutableInitializedSigner = true;
    dataStore.set(account, true);

    return true;
  }

  return false;
};
const onlySigners = (dataStore: AccessRoleStore, account: Address) => {
  if (!isSigner(dataStore, account)) {
    throw new Error(' request denied ');
  }
};

/* ------------------------------
      ROLE: PAUSER
------------------------------ */
const added_pauser = createEventNotifier<Address, Address>('pauser added', 'account', 'requested by');
const remove_pauser = createEventNotifier<Address, Address>('pauser removed', 'account', 'requested by');
/* tslint:disable-next-line:no-let*/
let mutableInitializedPauser = false;

const isPauser = (dataStore: AccessRoleStore, account: Address) => dataStore.has(account) && dataStore.get(account);

const addPauser = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isPauser(dataStore, requestedBy) && !isPauser(dataStore, account)) {
    dataStore.set(account, true);
    added_pauser(account, requestedBy);
  }
};
const revokePauser = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isPauser(dataStore, requestedBy) && isPauser(dataStore, account) && account !== requestedBy) {
    dataStore.set(account, false);
    remove_pauser(account, requestedBy);
  }
};
const firstPauser = (dataStore: AccessRoleStore, account: Address): boolean => {
  if (mutableInitializedPauser) {
    mutableInitializedPauser = true;
    dataStore.set(account, true);

    return true;
  }

  return false;
};
const onlyPausers = (dataStore: AccessRoleStore, account: Address) => {
  if (!isPauser(dataStore, account)) {
    throw new Error(' request denied ');
  }
};

/* ------------------------------
      ROLE: WHITELISTED
------------------------------ */
const added_whitelisted_account = createEventNotifier<Address, Address>(
  'whitelisted account',
  'account',
  'requested by',
);
const remove_whitelisted_account = createEventNotifier<Address, Address>(
  'removed account from whitelist',
  'account',
  'requested by',
);

const isWhitelisted = (dataStore: AccessRoleStore, account: Address) =>
  dataStore.has(account) && dataStore.get(account);

const addWhitelisted = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isWhitelistAdmin(dataStore, requestedBy) && !isWhitelisted(dataStore, account) && account !== requestedBy) {
    dataStore.set(account, true);
    added_whitelisted_account(account, requestedBy);
  }
};
const onlyWhitelisted = (dataStore: AccessRoleStore, account: Address) => {
  if (!isWhitelisted(dataStore, account)) {
    throw new Error(' not whitelisted ');
  }
};
const revokeWhitelisted = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isWhitelisted(dataStore, requestedBy) && isWhitelisted(dataStore, account) && account !== requestedBy) {
    dataStore.set(account, false);
    remove_whitelisted_account(account, requestedBy);
  }
};

/* ------------------------------
      ROLE: WHITELIST_ADMIN
------------------------------ */
const added_whitelist_admin = createEventNotifier<Address, Address>('whitelist_admin added', 'account', 'requested by');
const remove_whitelist_admin = createEventNotifier<Address, Address>(
  'whitelist_admin removed',
  'account',
  'requested by',
);
/* tslint:disable-next-line:no-let*/
let mutableInitializedWhitelistAdmin = false;

const isWhitelistAdmin = (dataStore: AccessRoleStore, account: Address) =>
  dataStore.has(account) && dataStore.get(account);

const addWhitelistAdmin = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isWhitelistAdmin(dataStore, requestedBy) && !isWhitelistAdmin(dataStore, account)) {
    dataStore.set(account, true);
    added_whitelist_admin(account, requestedBy);
  }
};
const revokeWhitelistAdmin = (dataStore: AccessRoleStore, account: Address, requestedBy: Address) => {
  if (isWhitelistAdmin(dataStore, requestedBy) && isWhitelistAdmin(dataStore, account) && account !== requestedBy) {
    dataStore.set(account, false);
    remove_whitelist_admin(account, requestedBy);
  }
};
const firstWhitelistAdmin = (dataStore: AccessRoleStore, account: Address): boolean => {
  if (mutableInitializedWhitelistAdmin) {
    mutableInitializedWhitelistAdmin = true;
    dataStore.set(account, true);

    return true;
  }

  return false;
};
const onlyWhitelistAdmins = (dataStore: AccessRoleStore, account: Address) => {
  if (!isWhitelistAdmin(dataStore, account)) {
    throw new Error(' request denied ');
  }
};

/* ====================================================
   ====================================================
              TRANSFERABLE OWNERSHIP
   ====================================================
   ==================================================== */
/* tslint:disable-next-line: variable-name */
const transfer_initiated = createEventNotifier<Address, Address>('contract ownership transfer initiated', 'from', 'to');

/* tslint:disable-next-line: variable-name */
const transfer_canceled = createEventNotifier<Address, Address>('contract ownership transfer canceled', 'from', 'to');

const transferred = createEventNotifier<Address, Address>('contract ownership transfer', 'from', 'to');

class TransferrableOwnershipData extends SmartContract {
  public mutableOwner: Address;
  public mutableTransferTo: Address;

  //  @constant
  public get owner(): Address {
    return this.mutableOwner;
  }
  public transferContract(to: Address): boolean {
    if (Address.isCaller(this.owner)) {
      if (this.owner === to) {
        return this.cancelTransfer();
      }

      return this.initiateTransfer(to);
    }

    if (Address.isCaller(to) && this.mutableTransferTo === to) {
      return this.claimContract(to);
    }

    return false;
  }

  private claimContract(to: Address) {
    transferred(this.owner, to);
    this.mutableOwner = to;

    return true;
  }

  private initiateTransfer(to: Address): boolean {
    transfer_initiated(this.owner, to);
    /*tslint:disable-next-line: no-object-mutation*/
    this.mutableTransferTo = to;

    return true;
  }

  private cancelTransfer(): boolean {
    if (this.mutableTransferTo !== undefined) {
      transfer_canceled(this.owner, this.mutableTransferTo);
      this.mutableTransferTo = undefined;
    }

    return true;
  }
}

/* ====================================================
   ====================================================
              CONTRACT PUBLIC API
   ====================================================
   ==================================================== */
const tokens_purchased = createEventNotifier<Address, Address, Fixed<8>, Fixed<8>>(
  'tokens purchased',
  'purchaser',
  'beneficiary',
  'NEO',
  'qty tokens',
);

class CrowdsaleContract extends SmartContract {
  private readonly _token: Address;
  private readonly _rate: Fixed<8>;
  private readonly _owner: Address;
  private readonly _wallet: Address;
  private readonly mutableNeoRaised: Fixed<8>;
  private readonly mutableTotalSupply: Fixed<8>;

  public constructor(token: Address, rate: Fixed<8>, wallet: Address, owner: Address) {
    super();
    this._owner = owner;
    this._token = token;
    this._rate = rate;
    this._wallet = wallet;
  }
  public get owner(): Address {
    return this._owner;
  }
  public get wallet() {
    return this._wallet;
  }
  public get token() {
    return this._token;
  }
  public get rate(): Fixed<8> {
    return this._rate;
  }
  public get neoRaised() {
    return this.mutableNeoRaised;
  }
  public get totalSupply() {
    return this.mutableTotalSupply;
  }
  public buyTokens(purchaser: Address, beneficiary: Address, amount: Fixed<8>) {
    this._preValidatePurchase(purchaser, beneficiary, amount);
    const tokens = this._getTokenAmount(amount);
    tokens_purchased(purchaser, beneficiary, amount, tokens);
    this._updatePurchasingState(purchaser, beneficiary, amount);
    this._forwardFunds();
    this._postValidatePurchase(purchaser, beneficiary, amount);
  }
  protected _preValidatePurchase(purchaser: Address, beneficiary: Address, amount: Fixed<8>) {}
  protected _updatePurchasingState(purchaser: Address, beneficiary: Address, amount: Fixed<8>) {}
  protected _forwardFunds() {}
  protected _postValidatePurchase(purchaser: Address, beneficiary: Address, amount: Fixed<8>) {}
  protected _getTokenAmount(amount) {
    return amount * this.rate;
  }
}

/* ====================================================
   ====================================================
              FEATURE: CappedCrowdsale
   ====================================================
   ==================================================== */
export abstract class CappedCrowdsale extends CrowdsaleContract {
  protected abstract readonly _cap;

  public get capReached() {
    return this.neoRaised >= this._cap;
  }
  protected _preValidatePurchase(purchaser: Address, beneficiary: Address, amount: Fixed<8>) {
    if (this.neoRaised + amount >= this._cap) {
      throw new Error('request denied');
    }
    super._preValidatePurchase(purchaser, beneficiary, amount);
  }
}

/* ====================================================
   ====================================================
              FEATURE: IndividuallyCappedCrowdsale
   ====================================================
   ==================================================== */

export class IndividuallyCappedCrowdsale extends CrowdsaleContract {
  private readonly contributions: MapStorage<Address, Fixed<8>>;
  private readonly individualCaps: MapStorage<Address, Fixed<8>>;
  private readonly capperDataStore: AccessRoleStore = MapStorage.for<Address, boolean>();

  /* tslint:disable-next-line:no-any  */
  public constructor(token: Address, rate: Fixed<8>, wallet: Address, owner: Address) {
    super(token, rate, wallet, owner);
    firstCapper(this.capperDataStore, owner);
  }

  public setCap(requestedBy: Address, account: Address, cap: Fixed<8>) {
    onlyCappers(this.capperDataStore, requestedBy);
    this.individualCaps.set(account, cap);
  }
  public getContributions(account: Address): Fixed<8> {
    return this.contributions.has(account) ? this.contributions.get(account) : 0;
  }
  protected _preValidatePurchase(purchaser: Address, account: Address, amount: Fixed<8>) {
    if (!this.individualCaps.has(account)) {
      throw new Error(' not a participant ');
    }
    if (this.getContributions(account) + amount >= this.individualCaps.get(account)) {
      throw new Error('request denied');
    }
    super._preValidatePurchase(purchaser, account, amount);
  }
  protected _updatePurchasingState(purchaser: Address, account: Address, amount: Fixed<8>) {
    super._updatePurchasingState(purchaser, account, amount);
    this.contributions.set(account, amount + this.getContributions(account));
  }
}

/* ====================================================
   ====================================================
              FEATURE: WhitelistedCrowdsale
   ====================================================
   ==================================================== */

export class WhitelistedCrowdsale extends CrowdsaleContract {
  private readonly whitelistAdminStore: AccessRoleStore = MapStorage.for<Address, boolean>();
  private readonly whitelistStore: AccessRoleStore = MapStorage.for<Address, boolean>();

  /* tslint:disable-next-line:no-any  */
  public constructor(token: Address, rate: Fixed<8>, wallet: Address, owner: Address) {
    super(token, rate, wallet, owner);
    firstCapper(this.whitelistAdminStore, owner);
  }

  public whitelistAccount(requestedBy: Address, account: Address) {
    onlyWhitelistAdmins(this.whitelistAdminStore, requestedBy);
    this.whitelistStore.set(account, true);
  }
  public unwhitelistAccount(reqeustedBy: Address, account: Address) {
    onlyWhitelistAdmins(this.whitelistAdminStore, reqeustedBy);
    this.whitelistStore.set(account, false);
  }
  protected _preValidatePurchase(purchaser: Address, account: Address, amount: Fixed<8>) {
    onlyWhitelisted(this.whitelistStore, account);
    super._preValidatePurchase(purchaser, account, amount);
  }
}

/* ====================================================
   ====================================================
              FEATURE: TimedCrowdSale
   ====================================================
   ==================================================== */

/* tslint:disable-next-line: variable-name */
const closing_time_extended = createEventNotifier<Fixed<8>, Fixed<8>, Address>(
  'closing time extended',
  'from',
  'to',
  'by',
);

const TimedCrowdsaleDefault = {
  openingTime: (Blockchain.currentBlockTime + 1000) as Fixed<8>,
  closingTime: (Blockchain.currentBlockTime + 5000) as Fixed<8>,
};

type TimedCrowdsaleArgs = typeof TimedCrowdsaleDefault;
interface TimedCrowdsaleConfigEntry {
  readonly timed: TimedCrowdsaleArgs;
}

export class TimedCrowdsale extends CrowdsaleContract {
  protected abstract readonly _openingTime: Fixed<8>;
  protected abstract mutableClosingTime: Fixed<8>;

  public getCurrentBlocktime(): Fixed<0> {
    return Blockchain.currentBlockTime;
  }
  public get openingTime() {
    return this._openingTime;
  }
  public get closingTime() {
    return this.mutableClosingTime;
  }
  public get timeRemaining(): Fixed<0> {
    return this.mutableClosingTime - Blockchain.currentBlockTime;
  }
  public onlyIfClosed() {
    if (!this.hasClosed()) {
      throw new Error(' Not closed yet ');
    }
  }
  public hasClosed(): boolean {
    return this.mutableClosingTime <= Blockchain.currentBlockTime;
  }
  public isOpen(): boolean {
    return Blockchain.currentBlockTime >= this._openingTime && Blockchain.currentBlockTime <= this.mutableClosingTime;
  }
  protected getConfigEntry({ openingTime, closingTime }: TimedCrowdsaleArgs): TimedCrowdsaleConfigEntry {
    if (closingTime < openingTime || openingTime < Blockchain.currentBlockTime) {
      throw new Error('invalid timed crowdsale arguments');
    }

    return { timed: { openingTime, closingTime } };
  }
  protected onlyWhileOpen() {
    if (!this.isOpen()) {
      throw new Error(' crowdsale is no longer open');
    }
  }
  protected _extendClosingTime(newClosingTime: Fixed<8>, requestedBy: Address) {
    if (!this.hasClosed() && newClosingTime > this.mutableClosingTime) {
      closing_time_extended(this.mutableClosingTime, newClosingTime, requestedBy);
      this.mutableClosingTime = newClosingTime;
    }
    throw new Error(' Invalid extension time');
  }
  protected _preValidatePurchase(purchaser: Address, beneficiary: Address, amount: Fixed<8>) {
    this.onlyWhileOpen();
    super._preValidatePurchase(purchaser, beneficiary, amount);
  }
}

// example Timed
const myTimedCrowdSale = new TimedCrowdsale(Address.from('ABCDEFG'), 3, Address.from('Wallet'), Address.from('owner'));

/* ====================================================
   ====================================================
              FEATURE: Pausable
   ====================================================
   ==================================================== */
const pauser_added = createEventNotifier<Address, Address>('Pauser added', 'account', 'by');
const pauser_revoked = createEventNotifier<Address, Address>('Pauser revoked', 'account', 'by');
const notify_paused = createEventNotifier<Address>('Crowdsale paused', 'by');
const notify_unpaused = createEventNotifier<Address>('Crowdsale unpaused', 'by');
export abstract class PausableCrowdsale extends TimedCrowdsale {
  protected readonly pausers: AccessRoleStore = MapStorage.for<Address, boolean>();
  protected mutablePaused = false;
  public isPauser(account: Address) {
    return isPauser(this.pausers, account);
  }
  public addPauser(requestedBy: Address, account: Address) {
    onlyPausers(this.pausers, requestedBy);
    if (this.isPauser(account)) {
      throw new Error('invalid request');
    }
    pauser_added(account, requestedBy);
    this.pausers.set(account, true);
  }
  public revokePauser(requestedBy: Address, account: Address) {
    onlySigners(this.pausers, requestedBy);
    pauser_revoked(account, requestedBy);
  }
  protected whenNotPaused() {
    if (this.mutablePaused) {
      throw new Error(' not paused ');
    }
  }
  public pause(requestedBy: Address) {
    onlyPausers(this.pausers, requestedBy);
    notify_paused(requestedBy);
    this.mutablePaused = true;
  }
  public resume(requestedBy: Address) {
    onlyPausers(this.pausers, requestedBy);
    notify_unpaused(requestedBy);
    this.mutablePaused = false;
  }
  public isPaused() {
    return this.mutablePaused;
  }
  protected _preValidatePurchase(purchaser: Address, beneficiary: Address, amount: Fixed<8>) {
    this.whenNotPaused();

    return super._preValidatePurchase(purchaser, beneficiary, amount);
  }
}

/* ====================================================
   ====================================================
              FEATURE: Signable Contract
   ====================================================
   ==================================================== */
const signer_added = createEventNotifier<Address, Address>('Pauser added', 'account', 'by');
const signer_revoked = createEventNotifier<Address, Address>('Pauser revoked', 'account', 'by');
export abstract class Signable extends SmartContract {
  protected readonly signers: AccessRoleStore = MapStorage.for<Address, boolean>();
  public isSigner(account: Address) {
    return isSigner(this.signers, account);
  }
  public addSigner(requestedBy: Address, account: Address) {
    onlySigners(this.signers, requestedBy);
    if (this.isSigner(account)) {
      throw new Error('invalid request');
    }
    signer_added(account, requestedBy);
    this.signers.set(account, true);
  }
  public revokeSigner(requestedBy: Address, account: Address) {
    onlySigners(this.signers, requestedBy);
    if (requestedBy === account) {
      throw new Error('invalid request');
    }
    signer_revoked(account, requestedBy);
  }
}

/* ====================================================
   ====================================================
              FEATURE: Increasing Price
   ====================================================
   ==================================================== */
interface IncreasingPriceConfig {
  readonly initialRate: Fixed<8>;
  readonly finalRate: Fixed<8>;
}

export abstract class IncreasingPriceCrowdsale extends TimedCrowdsale {
  public readonly _initialRate: Fixed<8>;
  public readonly _finalRate: Fixed<8>;

  public get rate(): Fixed<8> {
    return this.getCurrentRate();
  }
  public getCurrentRate() {
    if (!this.isOpen) {
      return 0;
    }
    const elapsedTime = Blockchain.currentBlockTime - this.openingTime;
    const timeRange = this.closingTime - this.openingTime;
    const rateRange = this._initialRate - this._finalRate;

    return this._initialRate - elapsedTime * (rateRange / timeRange);
  }

  public initialRate() {
    return this._initialRate;
  }
  public finalRate() {
    return this._finalRate;
  }

  public validate({ finalRate, initialRate }: IncreasingPriceConfig) {
    if (finalRate <= 0 || initialRate <= finalRate) {
      throw new Error('invalid rate configuration');
    }
  }
}

/* ====================================================
   ====================================================
              FEATURE: FinalizableCrowdsale
   ====================================================
   ==================================================== */
const crowdsale_finalized = createEventNotifier('crowdsale finalized');
export abstract class FinalizableCrowdsale extends TimedCrowdsale {
  private readonly mutableFinalized = false;

  public get finalized() {
    return this.mutableFinalized;
  }

  public finalize() {
    // anyone can finalize
    if (this.finalized || this.hasClosed()) {
      throw new Error('invalid request');
    }
    crowdsale_finalized();
    this._finalization();
  }

  // When overriding, be sure to call super to ensure the finalization chain is fully executed
  protected _finalization() {
    // override with what "finalize" means to you.
  }
}

export abstract class TimedCrowdsaleWithBalances extends TimedCrowdsale {
  protected readonly _balances = MapStorage.for<Address, Fixed<8>>();

  protected _updatePurchasingState(purchaser: Address, account: Address, amount: Fixed<8>) {
    this._balances.set(account, this.balanceOf(account) + amount);
    super._updatePurchasingState(purchaser, account, amount);
  }
  protected balanceOf(account: Address) {
    return this._balances.has(account) ? this._balances.get(account) : 0;
  }
}
/* ====================================================
   ====================================================
              FEATURE: PostDeliveryCrowdsale
   ====================================================
   ==================================================== */
const delivered_tokens = createEventNotifier<Address, Fixed<8>>('Delievered Tokens', 'to', 'amout');
export abstract class PostDeliveryCrowdsale extends TimedCrowdsaleWithBalances {
  public withdrawTokens(account: Address) {
    this.onlyIfClosed();
    const amount = this.balanceOf(account);
    if (amount <= 0) {
      throw new Error('insufficent funds');
    }
    this._balances.set(account, 0);
    //_deliverTokens(beneficiary, amount);
  }
}

/* ====================================================
   ====================================================
              FEATURE: SNAPSHOT
   ====================================================
   ==================================================== */
// Snapshot & DataStore
type SnapshotTotalSupplyStore = SerializableValueArray<Fixed<8>>;
type SnapShotBalanceStore = MapStorage<Address, SerializableValueArray<Fixed<8>>>;

interface SnapshotStore {
  // snapshot @ address,iteration = balance,totalSupply
  readonly _accountSnapshots: SnapShotBalanceStore;
  readonly mutableTotalSupplySnapshots: SnapshotTotalSupplyStore;
}

export abstract class WithSnapshots extends TimedCrowdsaleWithBalances {
  private readonly _accountSnapshots = MapStorage.for<Address, SerializableValueArray<Fixed<8>>>();
  private mutableTotalSupplySnapshots = [] as ReadonlyArray<Fixed<8>>;

  // How to get last?
  public getLastSnapForAccount(account: Address): Fixed<8> {
    if (this._accountSnapshots.has(account)) {
      const balances = this._accountSnapshots.get(account);

      return balances[balances.length - 1];
    }

    return 0;
  }
  public getLastTotalSupplyEntry() {
    const retv = this.mutableTotalSupplySnapshots[this.mutableTotalSupplySnapshots.length - 1];

    return retv ? retv : 0;
  }

  protected takeSnapshot(
    totalSupply: Fixed<0>,
    balanceStore: BalanceStore,
    balanceHistory: SnapShotBalanceStore,
    totalSupplySnaps: SnapShotBalanceStore,
    account: Address,
  ) {
    if (Address.isCaller(account)) {
      const lastBalance = this.getLastSnapForAccount(account);
      const current = this.balanceOf(account);
      if (current !== lastBalance) {
        const snapshots = this._accountSnapshots.get(account);
        this._accountSnapshots.set(account, [...snapshots, current]);
      }
      const lastRecordedTotalSupply = this.getLastTotalSupplyEntry();

      if (this.totalSupply !== lastRecordedTotalSupply) {
        this.mutableTotalSupplySnapshots = [...this.mutableTotalSupplySnapshots, this.totalSupply];
      }
    }
    throw new Error(' invalid request ');
  }
}

/** TEST  */
class SampleCrowdsaleToken extends NEP5Token(SmartContract) {
  public name: 'Sample Token';
  public symbol: 'SXT';
  public decimals: 8;
}

/* CROWDSALE */

// What the constructor needs
interface CrowdSaleConfig {
  readonly token: Address;
}
// the params that are needed for most crowdsale transactions
interface CrowdSaleParams {
  readonly purchaser: Address;
  readonly beneficiary: Address;
  readonly amount: Fixed<8>;
}
