import { common, crypto, HDNode, PublicKeyString } from '@neo-one/client-common';
import _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import {
  HDMasterDuplicateError,
  InvalidHDAccountPermissionError,
  InvalidHDStoredPathError,
  UndiscoverableChainError,
  UndiscoverableWalletError,
} from '../../errors';
import { HDLocalStore, LocalPath } from './LocalHDHandler';

interface ParsedNodePaths {
  readonly accounts: ReadonlyArray<string>;
  readonly chains: ReadonlyArray<string>;
  readonly wallets?: ReadonlyArray<string>;
  readonly master?: string;
}

interface TreeUpdate {
  readonly index: number;
  readonly wallet: NodeWallet;
}

interface TreeUpdatePromise {
  readonly update: TreeUpdate;
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
}

export interface NodeAccount {
  readonly node: HDNode;
  readonly path: LocalPath;
}

export type NodeAccounts = Record<string, NodeAccount>;

export interface NodeChain {
  readonly node: HDNode;
  readonly accounts: NodeAccounts;
}

export type NodeChains = Record<string, NodeChain>;

export interface NodeWallet {
  readonly node?: HDNode;
  readonly chains: NodeChains;
}

export type NodeWallets = Record<string, NodeWallet>;

export interface HDTree {
  readonly node?: HDNode;
  readonly wallets: NodeWallets;
}

const serializeChain = (chain: NodeChain, walletIndex: number) => {
  const nodes = Object.values(chain.accounts).map(({ node }) => serializeNode(node, [walletIndex, chain.node.index]));

  return [serializeNode(chain.node, [walletIndex])].concat(nodes);
};

const serializeWallet = (wallet: NodeWallet) => {
  const nodes = _.flatten(
    Object.values(wallet.chains).map((chain) =>
      wallet.node === undefined ? serializeChain(chain, 0) : serializeChain(chain, wallet.node.index),
    ),
  );
  if (wallet.node !== undefined) {
    return [serializeNode(wallet.node, [])].concat(nodes);
  }

  return nodes;
};

const serializeTree = (tree: HDTree) => {
  const nodes = _.flatten(Object.values(tree.wallets).map(serializeWallet));
  if (tree.node !== undefined) {
    return [
      {
        path: 'm',
        serializedNode: crypto.serializeHDNode(tree.node),
      },
    ].concat(nodes);
  }

  return nodes;
};

const serializeNode = (node: HDNode, parentPath: ReadonlyArray<number>) => ({
  path: `m/${parentPath.concat(node.index).join('/')}`,
  serializedNode: crypto.serializeHDNode(node),
});

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

export class LocalHDStore implements HDLocalStore {
  private get tree(): HDTree {
    return this.treeInternal$.getValue();
  }

  private get wallets(): NodeWallets {
    return this.tree.wallets;
  }

  private readonly storage: LocalHDStorage;
  private readonly initPromise: Promise<ReadonlyArray<number> | Error>;
  private readonly treeInternal$: BehaviorSubject<HDTree>;
  private readonly mutableQueue: TreeUpdatePromise[];
  private mutableUpdating: boolean;

  public constructor(storage: LocalHDStorage) {
    this.storage = storage;
    this.treeInternal$ = new BehaviorSubject<HDTree>({
      wallets: {},
    });
    this.mutableQueue = [];
    this.mutableUpdating = false;

    this.initPromise = this.init();
  }

  public async getMasterPath(): Promise<ReadonlyArray<number>> {
    const init = await this.initPromise;
    if (init instanceof Error) {
      throw init;
    }

    return init;
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
    await this.initPromise;

    const serializedTree = serializeTree(this.tree);
    await Promise.all(
      serializedTree.map(async (parsedNode) => this.storage.setItem(parsedNode.path, parsedNode.serializedNode)),
    );
  }

  private async getWalletOrUndefined(index: number): Promise<NodeWallet | undefined> {
    const init = await this.initPromise;
    if (init instanceof Error) {
      throw init;
    }

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

    await this.updateTree({
      index,
      wallet: newWallet,
    });

    return newWallet;
  }

  private async getChain(path: [number, number]): Promise<NodeChain> {
    const wallet = await this.getWallet(path[0]);
    const maybeChain = wallet.chains[path[1]] as NodeChain | undefined;

    if (maybeChain !== undefined) {
      return maybeChain;
    }

    if (wallet.node === undefined) {
      throw new UndiscoverableChainError(path);
    }

    const discoveredChain = crypto.deriveChildKey(wallet.node, path[1], false); // HARDENED ?
    const newChain = { node: discoveredChain, accounts: {} };
    const newWallet = { node: wallet.node, chains: { ...wallet.chains, [path[1]]: newChain } };

    await this.updateTree({
      index: path[0],
      wallet: newWallet,
    });

    return newChain;
  }

  private async getAccount(path: LocalPath): Promise<NodeAccount> {
    const chain = await this.getChain([path[0], path[1]]);
    const maybeAccount = chain.accounts[path[2]] as NodeAccount | undefined;

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

    await this.updateTree({
      index: path[0],
      wallet: newWallet,
    });

    return newAccount;
  }

  private async init(): Promise<ReadonlyArray<number> | Error> {
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

    return new InvalidHDStoredPathError(accessNode);
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

    let wallets: NodeWallets = {};
    if (walletsIn === undefined) {
      if (masterNode === undefined) {
        wallets = await this.constructWallets(['m/0'], chainsIn, accountsIn);
      }
    } else {
      wallets = await this.constructWallets(walletsIn, chainsIn, accountsIn);
    }

    return {
      node: masterNode,
      wallets,
    };
  }

  private async constructWallets(
    walletPaths: ReadonlyArray<string>,
    chainPaths: ReadonlyArray<string>,
    accountPaths: ReadonlyArray<string>,
  ): Promise<NodeWallets> {
    const constructed = await walletPaths.reduce<
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

        const index = walletPath.split('/')[1];

        return {
          wallets: { ...acc.wallets, [index]: wallet },
          accounts: remainingAccounts,
          chains: remainingChains,
        };
      },
      Promise.resolve({
        accounts: accountPaths,
        chains: chainPaths,
        wallets: {},
      }),
    );

    return constructed.wallets;
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

        const index = child.split('/')[2];

        return {
          chains: { ...acc.chains, [index]: chain },
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

  private async getNodeFromPathOrUndefined(path: string | undefined): Promise<HDNode | undefined> {
    if (path === undefined) {
      return undefined;
    }

    return this.getNodeFromPath(path)
      .then((node) => node)
      .catch(() => undefined);
  }

  private async getNodeFromPath(path: string): Promise<HDNode> {
    const extendedKey = await this.storage.getItem(path);

    return crypto.parseExtendedKey(extendedKey);
  }

  private async updateTree(update: TreeUpdate): Promise<void> {
    // tslint:disable-next-line:promise-must-complete
    const promise = new Promise<void>((resolve, reject) => {
      this.mutableQueue.push({
        update,
        resolve,
        reject,
      });
    });

    this.startUpdateLoop().catch(() => {
      // do nothing
    });

    return promise;
  }

  private async startUpdateLoop(): Promise<void> {
    if (this.mutableUpdating) {
      return;
    }

    this.mutableUpdating = true;

    let entry = this.mutableQueue.shift();
    // tslint:disable-next-line:no-loop-statement
    while (entry !== undefined) {
      try {
        await this.doUpdate(entry.update);
        entry.resolve();
      } catch (error) {
        entry.reject(error);
      }
      entry = this.mutableQueue.shift();
    }

    this.mutableUpdating = false;
  }

  private async doUpdate(update: TreeUpdate): Promise<void> {
    const { index, wallet } = update;

    return new Promise<void>((resolve, reject) => {
      try {
        this.treeInternal$.next({
          node: this.tree.node,
          wallets: {
            ...this.tree.wallets,
            [index]: wallet,
          },
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}
