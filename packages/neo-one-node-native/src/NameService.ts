import { common, crypto, UInt160 } from '@neo-one/client-common';
import {
  assertArrayStackItem,
  assertStructStackItem,
  BlockchainSettings,
  NameService as NameServiceNode,
  NativeContractStorageContext,
  RecordType,
  StackItem,
  utils,
} from '@neo-one/node-core';
import BN from 'bn.js';
import _ from 'lodash';
import { map, toArray } from 'rxjs/operators';
import { nameServiceMethods } from './methods';
import { NFTState, NFTStateAdd } from './NFTState';
import { NonfungibleToken } from './NonfungibleToken';

export class NameService extends NonfungibleToken implements NameServiceNode {
  private static readonly nameRegex = new RegExp(/^(?=.{3,255}$)([a-z0-9]{1,62}\\.)+[a-z][a-z0-9]{0,15}$/, 's');
  private readonly prefixes = {
    roots: Buffer.from([10]),
    domainPrice: Buffer.from([22]),
    expiration: Buffer.from([20]),
    record: Buffer.from([12]),
  };

  public constructor(settings: BlockchainSettings) {
    super({
      name: 'NameService',
      symbol: 'NNS',
      methods: nameServiceMethods,
      settings,
    });
  }

  public async ownerOf({ storages }: NativeContractStorageContext, tokenId: Buffer) {
    const maybeToken = await storages.tryGet(
      this.createStorageKey(this.basePrefixes.token).addBuffer(this.getKey(tokenId)).toStorageKey(),
    );

    // TODO: should this be try or tryGet()? Same question applies to NonfungibleToken method
    if (maybeToken === undefined) {
      throw new Error();
    }

    // TODO: need to use generic type definition here?
    return utils.getInteroperable(maybeToken, NameState.fromStackItem).owner;
  }

  public async getRoots({ storages }: NativeContractStorageContext) {
    const maybeRoots = await storages.tryGet(this.createStorageKey(this.prefixes.roots).toStorageKey());

    if (maybeRoots === undefined) {
      return new StringList([]).list;
    }

    return utils.getInteroperable(maybeRoots, StringList.fromStackItem).list;
  }

  public async getPrice({ storages }: NativeContractStorageContext) {
    const price = await storages.get(this.createStorageKey(this.prefixes.domainPrice).toStorageKey());

    return new BN(price.value);
  }

  public async isAvailable({ storages }: NativeContractStorageContext, name: string) {
    if (!NameService.nameRegex.test(name)) {
      throw new Error('Invalid name');
    }
    const names = name.split('.');
    if (names.length !== 2) {
      throw new Error('Name must be correct format');
    }
    const nameHash = this.getKey(Buffer.from(name, 'utf8'));
    const maybeName = await storages.tryGet(
      this.createStorageKey(this.basePrefixes.token).addBuffer(nameHash).toStorageKey(),
    );
    if (maybeName !== undefined) {
      return false;
    }
    const storageRoots = await storages.get(this.createStorageKey(this.prefixes.roots).toStorageKey());
    const { list } = utils.getInteroperable(storageRoots, StringList.fromStackItem);
    if (list.indexOf(names[1]) === -1) {
      throw new Error();
    }

    return true;
  }

  public async getRecord({ storages }: NativeContractStorageContext, name: string, record: RecordType) {
    if (!NameService.nameRegex.test(name)) {
      throw new Error('Invalid record name');
    }

    const { hashDomain, hashName } = this.getRecordHashes(name);

    const maybeItem = await storages.tryGet(
      this.createStorageKey(this.prefixes.record)
        .addBuffer(hashDomain)
        .addBuffer(hashName)
        .addBuffer(Buffer.from([record])) // TODO: check
        .toStorageKey(),
    );

    return maybeItem === undefined ? undefined : maybeItem.value.toString('utf8');
  }

  public async getRecords({ storages }: NativeContractStorageContext, name: string) {
    if (!NameService.nameRegex.test(name)) {
      throw new Error('Invalid record name');
    }

    const { hashDomain, hashName } = this.getRecordHashes(name);

    return storages
      .find$(this.createStorageKey(this.prefixes.record).addBuffer(hashDomain).addBuffer(hashName).toSearchPrefix())
      .pipe(
        // tslint:disable-next-line: no-useless-cast
        map(({ key, value }) => [key.key[key.key.length - 1], value.value.toString('utf8')] as const),
        toArray(),
      )
      .toPromise();
  }

  public async resolve(context: NativeContractStorageContext, name: string, type: RecordType) {
    return this.resolveInternal(context, name, type, 2);
  }

  // TODO: implement caching here
  protected getKey(tokenId: Buffer): UInt160 {
    return crypto.hash160(tokenId);
  }

  private async resolveInternal(
    context: NativeContractStorageContext,
    name: string,
    type: RecordType,
    redirect: number,
  ): Promise<string | undefined> {
    if (redirect < 0) {
      throw new Error('Invalid redirect');
    }
    // TODO: add caching?
    const dictionary = _.fromPairs((await this.getRecords(context, name)).map((record) => [record[0], record[1]]));
    const maybeResolved = dictionary[type];
    // tslint:disable-next-line: strict-type-predicates
    if (maybeResolved !== undefined) {
      return maybeResolved;
    }
    const maybeCNAME = dictionary[RecordType.CNAME];
    // tslint:disable-next-line: strict-type-predicates
    if (maybeCNAME === undefined) {
      return undefined;
    }

    return this.resolveInternal(context, maybeCNAME, type, redirect - 1);
  }

  private getRecordHashes(name: string) {
    const domain = name.split('.').slice(-2).join('.');
    const hashDomain = this.getKey(Buffer.from(domain, 'utf8'));
    const hashName = this.getKey(Buffer.from(name, 'utf8'));

    return { hashDomain, hashName };
  }
}

interface NameStateAdd extends NFTStateAdd {
  readonly expiration: BN;
  readonly admin: UInt160;
}

class NameState extends NFTState {
  public static fromStackItem(stackItem: StackItem) {
    const { owner, name, description } = super.fromStackItem(stackItem);
    const { array } = assertStructStackItem(stackItem);
    const expiration = array[3].getInteger();
    const admin = common.bufferToUInt160(array[4].getBuffer());

    return new NameState({
      owner,
      name,
      description,
      expiration,
      admin,
    });
  }

  public readonly expiration: BN;
  public readonly admin: UInt160;
  public constructor({ expiration, admin, owner, name, description }: NameStateAdd) {
    super({ owner, name, description });
    this.expiration = expiration;
    this.admin = admin;
  }

  public get id() {
    return Buffer.from(this.name, 'utf8');
  }
}

class StringList {
  public static fromStackItem(stackItem: StackItem) {
    const { array } = assertArrayStackItem(stackItem);
    const list = array.map((item) => item.getString());

    return new StringList(list);
  }

  public readonly list: readonly string[];

  public constructor(list: readonly string[]) {
    this.list = list;
  }
}
