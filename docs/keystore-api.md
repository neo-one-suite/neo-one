---
id: keystore-api
title: Key Store API
---
The NEO•ONE Key Store API is used for directly managing Accounts and Wallets for the Client.  The keystore is accessed through the Client's [providers](/docs/en/client-api.html#providers).

```ts
const keystore = client.providers.memory.keystore
```

## Methods
  - [getCurrentAccount](#getCurrentAccount)
  - [getAccounts](#getAccounts)
  - [sign](#sign)
  - [selectAccount](#selectAccount)
  - [updateAccountName](#updateAccountName)
  - [getWallet](#getWallet)
  - [getWallets$](#getWallets$)
  - [addAccount](#addAccount)
  - [deleteAccount](#deleteAccount)
  - [unlockWallet](#unlockWallet)

## Methods Reference

<a id="getCurrentAccount"></a>
#### getCurrentAccount(): [UserAccount](/docs/en/client-types.html#UserAccount)
  - Returns the [UserAccount](/docs/en/client-types.html#UserAccount) currently selected by the keystore. This is the default [UserAccount](/docs/en/client-types.html#UserAccount) for all operations.
  - For most cases, use [getCurrentAccount](/docs/en/client-api.html#getCurrentAccount) directly from the [Client](/docs/en/client-api.html)

<a id="getAccounts"></a>
#### getAccounts(): ReadonlyArray<[UserAccount](/docs/en/client-types.html#UserAccount)>
  - Returns all [UserAccounts](/docs/en/client-types.html#UserAccount) stored in the keystore.
  - For most cases, use [getAccounts](/docs/en/client-api.html#getAccounts) directly from the [Client](/docs/en/client-api.html)

<a id="sign"></a>
#### sign({[UserAccountID](/docs/en/client-types.html#UserAccountID), string}): Promise<[Witness](/docs/en/client-types.html#Witness)>
  - Creates a signature using the provided [UserAccountID's](/docs/en/client-types.html#UserAccountID) private key and the provided string message. Returns the created [Witness](/docs/en/client-types.html#Witness).
  - In most cases, signatures are handled automatically by methods in one of the higher level APIs.

<a id="selectAccount"></a>
#### selectAccount([UserAccountID?](/docs/en/client-types.html#UserAccountID)): Promise\<void\>
  - Sets the [UserAccount](/docs/en/client-types.html#UserAccount) associated with the provided [UserAccountID](/docs/en/client-types.html#UserAccountID) to be the current account used as the default for all operations.
  - For most cases use [selectAccount](/docs/en/client-api.html#selectAccount) directly from the [Client](/docs/en/client-api.html).

<a id="updateAccountName"></a>
#### updateAccountName([UpdateAccountNameOptions](/docs/en/client-types.html#UpdateAccountNameOptions)): Promise
<void\>
  - Updates the name associated with the account identified by the provided [UpdateAccountNameOptions](/docs/en/client-types.html#UpdateAccountNameOptions) for a wallet that is stored in this keystore.
  - For most cases use [updateAccountName](/docs/en/client-api.html#updateAccountName) directly from the [Client](/docs/en/client-api.html).

<a id="getWallet"></a>
#### getWallet([UserAccountID](/docs/en/client-types.html#UserAccountID)): [Wallet](/docs/en/client-types.html#Wallet)
  - Returns the [Wallet](/docs/en/client-types.html#Wallet) associated with the provided [UserAccountID](/docs/en/client-types.html#UserAccountID) that is stored in the keystore.

<a id="getWallets$"></a>
#### getWallets$([UserAccountID](/docs/en/client-types.html#UserAccountID)): Observable<[Wallet](/docs/en/client-types.html#Wallet) | undefined>
  - Returns an Observable which emits the [Wallet](/docs/en/client-types.html#Wallet) associated with the given [UserAccountID](/docs/en/client-types.html#UserAccountID) if it exists in the keystore. Emits undefined otherwise.

<a id="addAccount">
#### addAccount({network: [NetworkType](/docs/en/client-types.html#NetworkType), privateKey?: [BufferString](/docs/en/client-types.html#BufferString), name?: string, password?: string, nep2?: string}): Promise<[Wallet](/docs/en/client-types.html#Wallet)>
  - Adds a [Wallet](/docs/en/client-types.html#Wallet) to the keystore.
  - Requires either a `privateKey` or a `password` with its associated `NEP-2` key.
  - Example:
    ```ts
    const keystore = client.providers.memory.keystore;

    const wallet = await keystore.addAccount({
      network: 'private',
      privateKey: createPrivateKey(),
    });
    ```

<a id="deleteAccount"></a>
#### deleteAccount([UserAccountID](/docs/en/client-types.html#UserAccountID)): Promise\<void\>
  - Removes [Wallet](/docs/en/client-types.html#Wallet) associated with the given [UserAccountID](/docs/en/client-types.html#UserAccountID) from the keystore.
  - For most cases use [deleteAccount](/docs/en/client-api.html#deleteAccount) directly from the [Client](/docs/en/client-api.html).

<a id="unlockWallet"></a>
#### unlockWallet({id: [UserAccountID](/docs/en/client-types.html#UserAccountID), password: string}): Promise\<void\>
  - Unlocks the [Wallet](/docs/en/client-types.html#Wallet) associated with the provided [UserAccountID](/docs/en/client-types.html#UserAccountID) stored in the keystore using the provided password.
  - Unlocking a [Wallet](/docs/en/client-types.html#Wallet) uses the password with the stored NEP-2 key to decrypt and store the private key.

<a id="lockWallet"></a>
#### lockWalet(id: [UserAccountID](/docs/en/client-types.html#UserAccountID)): Promise\<void\>
  - Locks the [Wallet](/docs/en/client-types.html#Wallet) associated with the provided [UserAccountID](/docs/en/client-types.html#UserAccountID) stored in the keystore.
  - Locking a [Wallet](/docs/en/client-types.html#Wallet) removes the stored private key data and keeps only the NEP-2 key.
