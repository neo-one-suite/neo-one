---
id: keystore-api
title: Key Store API
---
The NEO•ONE Key Store API is used for directly managing Accounts and Wallets for the Client.  The keystore is accessed through the Client's [providers](/docs/en/client-api.html#providers).

```ts
const keystore = client.providers.memory.keystore;
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
  - Example:
    ```ts
    const keystore = client.providers.memory.keystore;

    const currentAccount = keystore.getCurrentAccount();
    const currentAccountName = currentAccount.name;
    ```

<a id="getAccounts"></a>
#### getAccounts(): ReadonlyArray<[UserAccount](/docs/en/client-types.html#UserAccount)>
  - Returns all [UserAccounts](/docs/en/client-types.html#UserAccount) stored in the keystore.
  - For most cases, use [getAccounts](/docs/en/client-api.html#getAccounts) directly from the [Client](/docs/en/client-api.html)
  - Example:
    ```ts
    const keystore = client.providers.memory.keystore;

    const accountNames = keystore.getAccounts().map((account) => account.name);
    ```

<a id="sign"></a>
#### sign({[UserAccountID](/docs/en/client-types.html#UserAccountID), string}): Promise<[Witness](/docs/en/client-types.html#Witness)>
  - Creates a signature using the provided [UserAccountID's](/docs/en/client-types.html#UserAccountID) private key and the provided string message. Returns the created [Witness](/docs/en/client-types.html#Witness).
  - In most cases, signatures are handled automatically by methods in one of the higher level APIs.

<a id="selectAccount"></a>
#### selectAccount([UserAccountID?](/docs/en/client-types.html#UserAccountID)): Promise\<void\>
  - Sets the [UserAccount](/docs/en/client-types.html#UserAccount) associated with the provided [UserAccountID](/docs/en/client-types.html#UserAccountID) to be the current account used as the default for all operations.
  - If no input is provided, a new account will be created and selected.
  - For most cases use [selectAccount](/docs/en/client-api.html#selectAccount) directly from the [Client](/docs/en/client-api.html).
  - Example:
    ```ts
    const keystore = client.providers.memory.keystore;

    await keystore.selectAccount();
    // currentAccount will be the account newly created by selectAccount
    const currentAccount = keystore.getCurrentAccount();
    ```

<a id="updateAccountName"></a>
#### updateAccountName([UpdateAccountNameOptions](/docs/en/client-types.html#UpdateAccountNameOptions)): Promise
<void\>
  - Updates the name associated with the account identified by the provided [UpdateAccountNameOptions](/docs/en/client-types.html#UpdateAccountNameOptions) for a wallet that is stored in this keystore.
  - For most cases use [updateAccountName](/docs/en/client-api.html#updateAccountName) directly from the [Client](/docs/en/client-api.html).
  - Example:
    ```ts
    const keystore = client.providers.memory.keystore;

    const account = keystore.getAccounts()[0];
    await keystore.updateAccountName({
      id: account.id,
      name: 'new-account-name',
    });

    await keystore.selectAccount(account.id);
    // prints 'new-account-name' to the console
    console.log(client.getCurrentAccount().name);
    ```

<a id="getWallet"></a>
#### getWallet([UserAccountID](/docs/en/client-types.html#UserAccountID)): [LocalWallet](/docs/en/client-types.html#LocalWallet)
  - Returns the [LocalWallet](/docs/en/client-types.html#LocalWallet) associated with the provided [UserAccountID](/docs/en/client-types.html#UserAccountID) that is stored in the keystore.
  - Example:
    ```ts
    function isWalletLocked(accountID: UserAccountID, keystore: LocalKeyStore): boolean {
      const wallet = keystore.getWallet(accountID);

      return wallet.type === 'locked';
    }
    ```

<a id="getWallets$"></a>
#### getWallets$([UserAccountID](/docs/en/client-types.html#UserAccountID)): Observable<[LocalWallet](/docs/en/client-types.html#LocalWallet) | undefined>
  - Returns an Observable which emits the [LocalWallet](/docs/en/client-types.html#LocalWallet) associated with the given [UserAccountID](/docs/en/client-types.html#UserAccountID) if it exists in the keystore. Emits undefined otherwise.

<a id="addAccount">
#### addAccount({network: [NetworkType](/docs/en/client-types.html#NetworkType), privateKey?: [BufferString](/docs/en/client-types.html#BufferString), name?: string, password?: string, nep2?: string}): Promise<[LocalWallet](/docs/en/client-types.html#LocalWallet)>
  - Adds a [LocalWallet](/docs/en/client-types.html#LocalWallet) to the keystore.
  - Requires either a `privateKey` or a `password` with its associated `NEP-2` key.
  - Example:
    ```ts
    const keystore = client.providers.memory.keystore;

    const wallet = await keystore.addAccount({
      network: 'private',
      privateKey: createPrivateKey(),
    });
    const walletAddress = wallet.account.id.address;
    ```

<a id="deleteAccount"></a>
#### deleteAccount([UserAccountID](/docs/en/client-types.html#UserAccountID)): Promise\<void\>
  - Removes [LocalWallet](/docs/en/client-types.html#LocalWallet) associated with the given [UserAccountID](/docs/en/client-types.html#UserAccountID) from the keystore.
  - For most cases use [deleteAccount](/docs/en/client-api.html#deleteAccount) directly from the [Client](/docs/en/client-api.html).
  - Example:
    ```ts
    const keystore = client.providers.memory.keystore;

    const userAccount = keystore.getAccounts()[0];
    // prints 'Aha!' one time.
    for (const account of keystore.getAccounts()) {
      if (account.id === userAccount.id) {
        console.log('Aha!')
      }

    await keystore.deleteAccount(userAccount.id);

    // prints nothing.
    for (const account of keystore.getAccounts()) {
      if (account.id === userAccount.id) {
        console.log('Aha!')
      }
    }
    ```

<a id="unlockWallet"></a>
#### unlockWallet({id: [UserAccountID](/docs/en/client-types.html#UserAccountID), password: string}): Promise\<void\>
  - Unlocks the [LocalWallet](/docs/en/client-types.html#LocalWallet) associated with the provided [UserAccountID](/docs/en/client-types.html#UserAccountID) stored in the keystore using the provided password.
  - Unlocking a [LocalWallet](/docs/en/client-types.html#LocalWallet) uses the password with the stored NEP-2 key to decrypt and store the private key.
  - Example:
    ```ts
    const keystore = client.providers.memory.keystore;

    const { password, userAccountID } = getDataFromUser();
    await unlockWallet({id: userAccountID, password});
    ```

<a id="lockWallet"></a>
#### lockWalet(id: [UserAccountID](/docs/en/client-types.html#UserAccountID)): Promise\<void\>
  - Locks the [LocalWallet](/docs/en/client-types.html#LocalWallet) associated with the provided [UserAccountID](/docs/en/client-types.html#UserAccountID) stored in the keystore.
  - Locking a [LocalWallet](/docs/en/client-types.html#LocalWallet) removes the stored private key and password data. Keeps only the NEP-2 key.
  - Example:
    ```ts
    async function lockAllWallets(keystore: LocalKeyStore: Promise<void> {
      const accounts = keystore.getAccounts();

      await Promise.all(accounts.map((account) => lockWallet(account.id)));
    }
    ```
