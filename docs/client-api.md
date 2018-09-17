---
id: client-api
title: Client API
---
This is the API documentation for the NEO•ONE Client.

## Properties
  - [currentAccount$](#currentAccount)
  - [accounts$](#accounts)
  - [currentNetwork$](#currentNetwork)
  - [networks$](#networks)
  - [block$](#block)
  - [accountState$](#accountState)
  - [providers](#providers)
  - [hooks](#hooks)
## Methods
  - [getAccount](#getAccount)
  - [selectAccount](#selectAccount)
  - [selectNetwork](#selectNetwork)
  - [deleteAccount](#deleteAccount)
  - [updateAccountName](#updateAccountName)
  - [getCurrentAccount](#getCurrentAccount)
  - [getAccounts](#getAccounts)
  - [getNetworks](#getNetworks)
  - [transfer](#transfer)
  - [publish](#publish)
  - [publishAndDeploy](#publishAndDeploy)
  - [registerAsset](#registerAsset)
  - [issue](#issue)
  - [read](#read)
  - [smartContract](#smartContract)
  - [inject](#inject)

## Properties Reference

#### currentAccount$
- type: Observable<[UserAccount](/docs/en/client-types.html#UserAccount) | undefined>
- Observable which returns a stream containing the currently active [UserAccount](/docs/en/client-types.html#UserAccount).
- The currently active account is the default account from which transactions will be initiated.

#### accounts$
- type: Observable<ReadonlyArray<[UserAccount](#UserAccount)>>
- Observable which returns a stream containing an array of all User Accounts registered with the client.


#### currentNetwork$
- type: Observable<[NetworkType](/docs/en/client-types.html#NetworkType)>
- Observable which returns a stream containing the currently active network.


#### networks$
- type: Observable<ReadonlyArray<[NetworkType](/docs/en/client-types.html#NetworkType)>>
- Observable which returns a stream containing an array of all networks registered with the client.


#### block$
- type: Observable<{block: [Block](/docs/en/client-types.html#), network: [NetworkType](/docs/en/client-types.html#NetworkType)}>
- Observable which returns a stream of blocks and their associated network as they are received.


#### accountState$
- type: Observable<{currentAccount: [UserAccount](/docs/en/client-types.html#UserAccount), account: [Account](/docs/en/client-types.html#Account)} | undefined>
- Observable which returns a stream containing all information on the currently active account.

#### providers
- type: UserAccountProviders
- Returns the User Account Providers.

#### hooks
- type: ClientHooks
- Returns all client hooks.

<br>
## Methods Reference

<a id="getAccount"></a>
#### getAccount([UserAccountID](/docs/en/client-types.html#UserAccountID)): [UserAccount](/docs/en/client-types.html#UserAccount)
  - `getAccount(UserAccountID)` is used to obtain a [UserAccount](/docs/en/client-types.html#UserAccount) from an input [UserAccountID](/docs/en/client-types.html#UserAccountID).

<a id="selectAccount"></a>
#### selectAccount([UserAccountID?](/docs/en/client-types.html#UserAccountID)): Promise\<void\>
  - Sets the current account to the account associated with the given [UserAccountID](/docs/en/client-types.html#UserAccountID).
The selected account will now be the default account from which transactions will be initiated by the client.

<a id="selectNetwork"></a>
#### selectNetwork([NetworkType](/docs/en/client-types.html#NetworkType)): Promise\<void\>
  - Sets the currently selected network to given network.  The client will now default to using the selected network for all operations.

<a id="deleteAccount"></a>
#### deleteAccount([UserAccountID?](/docs/en/client-types.html#UserAccountID)): Promise\<void\>
  - Removes the account associated with the given UserAccountID from the list of accounts registered with the client.

<a id="updateAccountName"></a>
#### updateAccountName([UpdateAccountNameOptions](/docs/en/client-types.html#UpdateAccountNameOptions)): Promise\<void\>
  - Updates the name associated with a given account

<a id="getCurrentAccount"></a>
#### getCurrentAccount(): [UserAccount](/docs/en/client-types.html#UserAccount) | undefined
  - Returns the currently selected User Account. Returns undefined if no account is selected.  This is the default account used for transactions initiated by the client.

<a id="getCurrentNetwork"></a>
#### getCurrentNetwork(): [NetworkType](/docs/en/client-types.html#NetworkType)
  - Returns the currently selected network. This is the default network on which the client will perform operations.

<a id="getAccounts"></a>
#### getAccounts(): ReadonlyArray<[UserAccount](/docs/en/client-types.html#UserAccount)>
  - Returns an array of all accounts registered with the client.

<a id="getNetworks"></a>
#### getNetworks(): ReadonlyArray<[NetworkType](/docs/en/client-types.html#NetworkType)>
  - Returns an array of all networks registered with the client.

<a id="transfer"></a>
#### transfer([BigNumber](https://github.com/MikeMcl/bignumber.js/), [Hash256String](/docs/en/client-types.html#Hash256String), [AddressString](/docs/en/client-types.html#AddressString), [TransactionOptions?](/docs/en/client-types.html#TransactionOptions)): Promise<[TransactionResult](/docs/en/client-types.html#TransactionResult)<[TransactionReceipt](/docs/en/client-types.html#TransactionReceipt), [ContractTransaction](/docs/en/client-types.html#ContractTransaction)>>

#### transfer(ReadonlyArray<[Transfer](/docs/en/client-types.html#Transfer)>, [TransactionOptions?](/docs/en/client-types.html#TransactionOptions)): Promise<[TransactionResult](/docs/en/client-types.html#TransactionResult)>
  - Transfer a given [Asset](/docs/en/client-types.html#Asset) identified by its [Hash256String](/docs/en/client-types.html#Hash256String) identifier to a given address in the amount specified.
  - Transfer will be from the currently selected account unless a from account is specified in the [TransactionOptions](/docs/en/client-types.html#TransactionOptions).
  - Transfer in batch by passing in an array of [Transfers](/docs/en/client-types.html#Transfer).

<a id="publish"></a>
#### publish([ContractRegister](/docs/en/client-types.html#ContractRegister), [TransactionOptions?](/docs/en/client-types.html#TransactionOptions)): Promise<[TransactionResult](/docs/en/client-types.html#TransactionResult)<[PublishReceipt](/docs/en/client-types.html#PublishReceipt), [InvocationTransaction](/docs/en/client-types.html#InvocationTransaction)>>
  - Publishes a given smart contract to the currently selected network.

<a id="publishAndDeploy"></a>
#### publishAndDeploy([ContractRegister](/docs/en/client-types.html#ContractRegister), [ABI](/docs/en/client-types.html#ABI), ReadonlyArray<[Param](/docs/en/client-types.html#Param)> = [], [TransactionOptions?](/docs/en/client-types.html#TransactionOptions), Promise<[SourceMaps](/docs/en/client-types.html#SourceMaps)> = Promise.resolve({})): Promise<[TransactionResult](/docs/en/client-types.html#TransactionResult)<[PublishReceipt](/docs/en/client-types.html#PublishReceipt), [InvocationTransaction](/docs/en/client-types.html#InvocationTransaction)>>
  - Publishes and deploys a smart contract to the currently selected network. Once confirmed, the smart contract will be ready for use.

<a id="registerAsset"></a>
#### registerAsset([AssetRegister](/docs/en/client-types.html#AssetRegister), [TransactionOptions?](/docs/en/client-types.html#TransactionOptions)): Promise<[TransactionResult](/docs/en/client-types.html#TransactionResult)<[RegisterAssetReceipt](/docs/en/client-types.html#RegisterAssetReceipt), [InvocationTransaction](/docs/en/client-types.html#InvocationTransaction)>>
  - Registers a new asset to the currently selected network.

<a id="issue"></a>
#### issue([BigNumber]([BigNumber](https://github.com/MikeMcl/bignumber.js/)), [Hash256String](/docs/en/client-types.html#Hash256String), [AddressString](/docs/en/client-types.html#AddressString), [TransactionOptions?](/docs/en/client-types.html#TransactionOptions)): Promise<[TransactionResult](/docs/en/client-types.html#TransactionResult)<[TransactionReceipt](/docs/en/client-types.html#TransactionReceipt), [IssueTransaction](/docs/en/client-types.html#IssueTransaction)>>
  - Issues a given amount of a given asset identified by its [Hash256String](/docs/en/client-types.html#Hash256String) to a given address.

<a id="read"></a>
#### read([NetworkType](/docs/en/client-types.html#NetworkType)): [ReadClient]()
  - Returns a ReadClient for the given network.  The ReadClient is used to obtain information about the blockchain.

<a id="smartContract"></a>
#### smartContract\<T extends [SmartContract]()\>([SmartContractDefinition]()): T
  - Creates a smart contract from a given smart contract definition.

<a id="inject"></a>
#### inject<K>(K extends keyof TUserAccountProviders ? TUserAccountProviders[K]: UserAccountProvider): void
  - Sets the current User Account Provider to the given provider.

