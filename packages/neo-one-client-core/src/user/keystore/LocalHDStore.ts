import { common, crypto, HDNode, PublicKeyString } from '@neo-one/client-common';
import { BehaviorSubject } from 'rxjs';
import {
  HDMasterDuplicateError,
  InvalidHDAccountPermissionError,
  InvalidHDStoredPathError,
  UndiscoverableChainError,
  UndiscoverableWalletError,
} from '../../errors';
import { HDLocalStore, LocalPath } from './LocalHDHandler';

export interface NodeAccount {
  readonly node: HDNode;
  readonly path: LocalPath;
}

export type NodeAccounts = { [Index in string]?: NodeAccount };

export interface NodeChain {
  readonly node: HDNode;
  readonly accounts: NodeAccounts;
}

export type NodeChains = { [Index in string]?: NodeChain };

export interface NodeWallet {
  readonly node?: HDNode;
  readonly chains: NodeChains;
}

export type NodeWallets = { [Index in string]?: NodeWallet };

export interface HDTree {
  readonly node?: HDNode;
  readonly wallets: NodeWallets;
}

interface ParsedNodePaths {
  readonly accounts: ReadonlyArray<string>;
  readonly chains: ReadonlyArray<string>;
  readonly wallets?: ReadonlyArray<string>;
  readonly master?: string;
}

export interface LocalHDStorage {
  /**
   * Set `key` to `value`.
   */
  readonly setItem: (key: string, value: string) => Promise<void>;
  /**
   * Return the value of `key`
   */
  readonly getItem: (key: string) => Promise<string>;
  /**
   * Remove `key`.
   */
  readonly removeItem: (key: string) => Promise<void>;
  /**
   * Return all keys.
   */
  readonly getAllKeys: () => Promise<ReadonlyArray<string>>;
}

const isChildOf = (parent: string) => {
  const parentPath = parent.split('/');

  return (child: string): boolean => {
    const childPath = child.split('/');

    return childPath.length === parentPath.length + 1 && parentPath.every((value, index) => value === childPath[index]);
  };
};

const filterAndRemaining = <T>(values: ReadonlyArray<T>, fn: (arg: T) => boolean) =>
  values.reduce<{
    readonly matches: ReadonlyArray<T>;
    readonly remaining: ReadonlyArray<T>;
  }>(
    (acc, value) => {
      if (fn(value)) {
        return {
          ...acc,
          matches: acc.matches.concat(value),
        };
      }

      return {
        ...acc,
        remaining: acc.remaining.concat(value),
      };
    },
    {
      matches: [],
      remaining: [],
    },
  );

export class LocalHDStore implements HDLocalStore {
  private get tree(): HDTree {
    return this.treeInternal$.getValue();
  }

  private get wallets(): NodeWallets {
    return this.tree.wallets;
  }

  private readonly storage: LocalHDStorage;
  private readonly initPromise: Promise<ReadonlyArray<number>>;
  private readonly treeInternal$: BehaviorSubject<HDTree>;

  public constructor(storage: LocalHDStorage) {
    this.storage = storage;
    this.treeInternal$ = new BehaviorSubject<HDTree>({
      wallets: {},
    });

    this.initPromise = this.init();
  }

  public async getMasterPath(): Promise<ReadonlyArray<number>> {
    return this.initPromise;
  }

  public async getPublicKey(path: LocalPath): Promise<PublicKeyString> {
    const extendedAccount = await this.getAccount(path);

    return common.ecPointToString(common.asECPoint(extendedAccount.node.publicKey));
  }

  public async sign(options: { readonly message: Buffer; readonly account: LocalPath }): Promise<Buffer> {
    const extendedAccount = await this.getAccount(options.account);
    const privateKey = extendedAccount.node.privateKey;

    if (privateKey === undefined) {
      throw new InvalidHDAccountPermissionError(options.account);
    }

    return crypto.sign({ message: options.message, privateKey });
  }

  public async close(): Promise<void> {
    // save stuff, need to serialize the HDTree
  }

  private async getWalletOrUndefined(index: number): Promise<NodeWallet | undefined> {
    await this.initPromise;

    return this.wallets[index];
  }

  private async getWallet(index: number): Promise<NodeWallet> {
    const maybeWallet = await this.getWalletOrUndefined(index);

    if (maybeWallet !== undefined) {
      return maybeWallet;
    }

    if (this.tree.node === undefined) {
      throw new UndiscoverableWalletError(index);
    }

    const discoveredWallet = crypto.deriveChildKey(this.tree.node, index, false); // ? SHOULD IT BE HARDENED? WHEN SHOULD IT BE?
    const newWallet = { node: discoveredWallet, chains: {} };

    this.treeInternal$.next({
      node: this.tree.node,
      wallets: {
        ...this.tree.wallets,
        [index]: newWallet,
      },
    });

    return newWallet;
  }

  private async getChain(path: [number, number]): Promise<NodeChain> {
    const wallet = await this.getWallet(path[0]);
    const maybeChain = wallet.chains[path[1]];

    if (maybeChain !== undefined) {
      return maybeChain;
    }

    if (wallet.node === undefined) {
      throw new UndiscoverableChainError(path);
    }

    const discoveredChain = crypto.deriveChildKey(wallet.node, path[1], false); // HARDENED ?
    const newChain = { node: discoveredChain, accounts: {} };
    const newWallet = { node: wallet.node, chains: { ...wallet.chains, [path[1]]: newChain } };

    this.treeInternal$.next({
      node: this.tree.node,
      wallets: {
        ...this.tree.wallets,
        [path[0]]: newWallet,
      },
    });

    return newChain;
  }

  private async getAccount(path: LocalPath): Promise<NodeAccount> {
    const chain = await this.getChain([path[0], path[1]]);
    const maybeAccount = chain.accounts[path[2]];

    if (maybeAccount !== undefined) {
      return maybeAccount;
    }

    const discoveredAccount = crypto.deriveChildKey(chain.node, path[2], false); // HARDENED ?
    const newAccount = { path, node: discoveredAccount };
    const newChain = { node: chain.node, accounts: { ...chain.accounts, [path[2]]: newAccount } };
    const maybeWallet = await this.getWalletOrUndefined(path[0]);
    const newWallet =
      maybeWallet === undefined
        ? { chains: { [path[1]]: newChain } }
        : { node: maybeWallet.node, chains: { ...maybeWallet.chains, [path[1]]: newChain } };

    this.treeInternal$.next({
      node: this.tree.node,
      wallets: {
        ...this.tree.wallets,
        [path[0]]: newWallet,
      },
    });

    return newAccount;
  }

  private async init(): Promise<ReadonlyArray<number>> {
    const pathKeys = await this.storage.getAllKeys();
    const accessNode = pathKeys.sort((a, b) => {
      if (a < b) {
        return -1;
      }

      return 1;
    })[0];

    const initTree = await this.getHDTree(pathKeys);
    this.treeInternal$.next(initTree);

    const masterPath = accessNode.split('/');
    if (masterPath[0] === 'm') {
      return masterPath.slice(1).map(Number);
    }

    throw new InvalidHDStoredPathError(accessNode);
  }

  private async getHDTree(keys: ReadonlyArray<string>) {
    const { accounts: accountsIn, chains: chainsIn, wallets: walletsIn, master } = keys.reduce<ParsedNodePaths>(
      (acc, path) => {
        const splitPath = path.split('/');

        switch (splitPath.length) {
          case 1:
            if (acc.master !== undefined) {
              throw new HDMasterDuplicateError();
            }

            return {
              ...acc,
              master: path,
            };

          case 2:
            return {
              ...acc,
              wallets: acc.wallets === undefined ? [path] : acc.wallets.concat(path),
            };

          case 3:
            return {
              ...acc,
              chains: acc.chains.concat(path),
            };

          case 4:
            return {
              ...acc,
              accounts: acc.accounts.concat(path),
            };

          default:
            throw new InvalidHDStoredPathError(path);
        }
      },
      {
        accounts: [],
        chains: [],
      },
    );

    const masterNode = await this.getNodeFromPathOrUndefined(master);
    const reduceWallets = walletsIn === undefined ? ['0'] : walletsIn;

    const { wallets } = await reduceWallets.reduce<
      Promise<{
        readonly accounts: ReadonlyArray<string>;
        readonly chains: ReadonlyArray<string>;
        readonly wallets: NodeWallets;
      }>
    >(
      async (accPromise, walletPath) => {
        const acc = await accPromise;
        const { wallet, remainingChains, remainingAccounts } = await this.constructWallet(
          walletPath,
          acc.chains,
          acc.accounts,
        );

        return {
          wallets: { ...acc.wallets, [walletPath.split('/')[-1]]: wallet },
          accounts: remainingAccounts,
          chains: remainingChains,
        };
      },
      Promise.resolve({
        accounts: accountsIn,
        chains: chainsIn,
        wallets: {},
      }),
    );

    return {
      node: masterNode,
      wallets,
    };
  }

  private async constructWallet(
    walletPath: string,
    chainPaths: ReadonlyArray<string>,
    accountPaths: ReadonlyArray<string>,
  ): Promise<{
    readonly wallet: NodeWallet;
    readonly remainingChains: ReadonlyArray<string>;
    readonly remainingAccounts: ReadonlyArray<string>;
  }> {
    const isChild = isChildOf(walletPath);
    // needs to be try/catch in case the default '0' isn't defined
    const walletNode = await this.getNodeFromPathOrUndefined(walletPath);
    const { matches: childPaths, remaining: remainingChains } = filterAndRemaining(chainPaths, isChild);

    const { chains, remainingAccounts } = await childPaths.reduce<
      Promise<{
        readonly chains: NodeChains;
        readonly remainingAccounts: ReadonlyArray<string>;
      }>
    >(
      async (accPromise, child) => {
        const acc = await accPromise;
        const { chain, remainingAccounts: leftoverAccounts } = await this.constructChain(
          walletNode === undefined ? 0 : walletNode.index,
          child,
          acc.remainingAccounts,
        );

        return {
          chains: { ...acc.chains, [child.split('/')[-1]]: chain },
          remainingAccounts: leftoverAccounts,
        };
      },
      Promise.resolve({
        chains: {},
        remainingAccounts: accountPaths,
      }),
    );

    return {
      wallet: {
        node: walletNode,
        chains,
      },
      remainingChains,
      remainingAccounts,
    };
  }

  private async constructChain(
    walletIndex: number,
    chainPath: string,
    accountPaths: ReadonlyArray<string>,
  ): Promise<{
    readonly chain: NodeChain;
    readonly remainingAccounts: ReadonlyArray<string>;
  }> {
    const isChild = isChildOf(chainPath);
    const chainNode = await this.getNodeFromPath(chainPath);
    const { matches, remaining } = filterAndRemaining(accountPaths, isChild);
    const childAccounts = await Promise.all(matches.map(async (match) => this.storage.getItem(match)));
    const childNodes = childAccounts.map((child) => crypto.parseExtendedKey(child));

    return {
      chain: {
        node: chainNode,
        accounts: childNodes.reduce<NodeAccounts>(
          (acc, child) => ({
            ...acc,
            [child.index]: {
              node: child,
              path: [walletIndex, chainNode.index, child.index],
            },
          }),
          {},
        ),
      },
      remainingAccounts: remaining,
    };
  }

  private async getNodeFromPathOrUndefined(path: string | undefined) {
    if (path === undefined) {
      return undefined;
    }

    return this.getNodeFromPath(path);
  }

  private async getNodeFromPath(path: string) {
    const extendedKey = await this.storage.getItem(path);

    return crypto.parseExtendedKey(extendedKey);
  }
}
