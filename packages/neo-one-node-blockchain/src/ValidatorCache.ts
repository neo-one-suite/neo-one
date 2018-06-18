import { Account, common, ECPoint, UInt160, UInt256, utils, Validator, ValidatorUpdate } from '@neo-one/client-core';
import { ValidatorsCount, ValidatorsCountUpdate } from '@neo-one/node-core';
import BN from 'bn.js';
import _ from 'lodash';
import { toArray } from 'rxjs/operators';
import { Blockchain } from './Blockchain';

export class ValidatorCache {
  private readonly blockchain: Blockchain;
  // tslint:disable-next-line readonly-keyword
  private readonly mutableAccounts: { [key: string]: Account };
  // tslint:disable-next-line readonly-keyword
  private readonly mutableValidators: { [key: string]: Validator | undefined };
  private mutableValidatorsCount: ValidatorsCount | undefined;

  public constructor(blockchain: Blockchain) {
    this.blockchain = blockchain;
    this.mutableAccounts = {};
    this.mutableValidators = {};
  }

  public async getAccount(hash: UInt160): Promise<Account> {
    let account = this.mutableAccounts[common.uInt160ToHex(hash)] as Account | undefined;
    if (account === undefined) {
      account = await this.blockchain.account.tryGet({ hash });
    }

    if (account === undefined) {
      account = new Account({ hash });
    }

    this.mutableAccounts[common.uInt160ToHex(hash)] = account;

    return account;
  }

  public async updateAccountBalance(hash: UInt160, asset: UInt256, value: BN): Promise<void> {
    const assetHex = common.uInt256ToHex(asset);
    await this.getAccount(hash);
    const hashHex = common.uInt160ToHex(hash);
    const account = this.mutableAccounts[hashHex];
    const balance = account.balances[assetHex];
    this.mutableAccounts[hashHex] = account.update({
      balances: {
        ...account.balances,
        [assetHex]: value.add(balance === undefined ? utils.ZERO : balance),
      },
    });
  }

  public async getValidator(publicKey: ECPoint): Promise<Validator> {
    const publicKeyHex = common.ecPointToHex(publicKey);

    let validator = this.mutableValidators[publicKeyHex];
    if (validator === undefined) {
      validator = await this.blockchain.validator.tryGet({ publicKey });
    }

    if (validator === undefined) {
      validator = new Validator({ publicKey });
    }

    this.mutableValidators[publicKeyHex] = validator;

    return validator;
  }

  public async addValidator(validator: Validator): Promise<void> {
    this.mutableValidators[common.ecPointToHex(validator.publicKey)] = validator;
  }

  public async deleteValidator(publicKey: ECPoint): Promise<void> {
    this.mutableValidators[common.ecPointToHex(publicKey)] = undefined;
  }

  public async updateValidatorVotes(publicKey: ECPoint, value: BN): Promise<void> {
    await this.getValidator(publicKey);
    const publicKeyHex = common.ecPointToHex(publicKey);
    const validator = this.mutableValidators[publicKeyHex];
    if (validator === undefined) {
      throw new Error('For Flow');
    }

    this.mutableValidators[publicKeyHex] = validator.update({
      votes: validator.votes.add(value),
    });
  }

  public async updateValidator(publicKey: ECPoint, update: ValidatorUpdate): Promise<Validator> {
    await this.getValidator(publicKey);
    const publicKeyHex = common.ecPointToHex(publicKey);
    const validator = this.mutableValidators[publicKeyHex];
    if (validator === undefined) {
      throw new Error('For Flow');
    }

    const newValidator = validator.update(update);
    this.mutableValidators[publicKeyHex] = newValidator;

    return newValidator;
  }

  public async getAllValidators(): Promise<ReadonlyArray<Validator>> {
    const validators = await this.blockchain.validator.all$.pipe(toArray()).toPromise();
    const mutablePublicKeyToValidator = _.fromPairs(
      validators.map((validator) => [common.ecPointToHex(validator.publicKey), validator]),
    );

    Object.entries(this.mutableValidators).forEach(([publicKey, validator]) => {
      const publicKeyHex = common.ecPointToHex(publicKey);
      if (validator === undefined) {
        // tslint:disable-next-line no-dynamic-delete
        delete mutablePublicKeyToValidator[publicKeyHex];
      } else {
        mutablePublicKeyToValidator[publicKeyHex] = validator;
      }
    });

    return Object.values(mutablePublicKeyToValidator);
  }

  public async getValidatorsCount(): Promise<ValidatorsCount> {
    let validatorsCount = this.mutableValidatorsCount;
    if (validatorsCount === undefined) {
      validatorsCount = await this.blockchain.validatorsCount.tryGet();
    }

    if (validatorsCount === undefined) {
      validatorsCount = new ValidatorsCount();
    }

    this.mutableValidatorsCount = validatorsCount;

    return validatorsCount;
  }

  public async updateValidatorsCountVotes(index: number, value: BN): Promise<void> {
    await this.getValidatorsCount();
    const validatorsCount = this.mutableValidatorsCount;
    if (validatorsCount === undefined) {
      throw new Error('For Flow');
    }

    const votes = validatorsCount.votes[index];

    this.mutableValidatorsCount = validatorsCount.update({
      votes: validatorsCount.votes
        .slice(0, index)
        .concat((votes === undefined ? utils.ZERO : votes).add(value))
        .concat(validatorsCount.votes.slice(index + 1)),
    });
  }

  public async addValidatorsCount(validatorsCount: ValidatorsCount): Promise<void> {
    this.mutableValidatorsCount = validatorsCount;
  }

  public async updateValidatorsCount(update: ValidatorsCountUpdate): Promise<ValidatorsCount> {
    await this.getValidatorsCount();
    const validatorsCount = this.mutableValidatorsCount;
    if (validatorsCount === undefined) {
      throw new Error('For Flow');
    }

    this.mutableValidatorsCount = validatorsCount.update(update);

    return this.mutableValidatorsCount;
  }
}
