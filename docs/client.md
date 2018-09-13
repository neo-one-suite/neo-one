---
id: client
title: Client
---
This is the API documentation for the NEO•ONE Client.

## Properties

```
currentAccount$: Observable<UserAccount | undefined>
```
* Observable which returns a stream containing the currently active User Account.
<br><br>
```
accounts$: Observable<ReadonlyArray<UserAccount>>
```
* Observable which returns a stream containing an array of all User Accounts registered with the client.
<br><br>
```
currentNetwork$: Observable<NetworkType>
```
* Observable which returns a stream containing the currently active network.
<br><br>
```
networks$: Observable<ReadonlyArray<NetworkType>>
```
* Observable which returns a stream containing an array of all networks registered with the client.
<br><br>
```
block$: Observable<{block: Block, network: NetworkType}>
```
* Observable which returns a stream of blocks and their associated network as they are received.
<br><br>
```
accountState$: Observable<{currentAccount: UserAccount, account: Account} | undefined>
```
* Observable which returns a stream containing all information on the currently active account.
<br><br>
```
accountState$: Observable<{currentAccount: UserAccount, account: Account} | undefined>
```
* Observable which returns a stream containing all information on the currently active account.
```
providers: TUserAccountProviders
```
* Returns the User Account Providers.
<br><br>

```
hooks: ClientHooks
```
* Returns all client hooks.
<br><br><br>
## Methods
```
getAccount(idIn: UserAccountID): UserAccount
```
* Returns the UserAccount for a given UserAccountID.
<br><br>
```
selectAccount(idIn?: UserAccountID): Promise<void>
```
* Sets the current account to the account associated with the given UserAccountID.
<br><br>
```
selectNetwork(networkIn: NetworkType): Promise<void>
```
* Sets the currently selected network to given network.
<br><br>
```
deleteAccount(idIn: UserAccountID): Promise<void>
```
* Removes the account associated with the given UserAccountID from the list of accounts registered with the client.
<br><br>
```
updateAccountName(options: UpdateAccountNameOptions): Promise<void>
```
* Updates the name associated with a given account
<br><br>
```
getCurrentAccount(): UserAccount | undefined
```
* Returns the currently selected User Account. Returns undefined if no account is selected.
<br><br>
```
getCurrentNetwork(): NetworkType
```
* Returns the currently selected network.
<br><br>
```
getAccounts(): ReadonlyArray<UserAccount>
```
* Returns an array of all accounts registered with the client.
<br><br>
```
getNetworks(): ReadonlyArray<NetworkType>
```
* Returns an array of all networks registered with the client.
<br><br>
```
getAccounts(): ReadonlyArray<UserAccount>
```
* Returns an array of all accounts registered with the client.
<br><br>
```
transfer(amount: BigNumber, asset: Hash256String, to: AddressString, options?: TransactionOptions): Promise<TransactionResult<TransactionReceipt, ContractTransaction>>

transfer(transfers: ReadonlyArray<Transfer>, options?: TransactionOptions): Promise<TransactionResult>
```
* Transfer a given asset to a given address in the amount specified.
* Transfer will be from the currently selected account unless a from account is specified in the options.
* A network or system fee may also be included in the options.
* Transfer in batch by passing in an array of Transfers.
<br><br>
```
publish(contract: ContractRegister, options?: TransactionOptions): Promise<TransactionResult<PublishReceipt, InvocationTransaction>>
```
* Publishes a given smart contract to the currently selected network.
<br><br>
```
publishAndDeploy(contract: ContractRegister, abi: ABI, params: ReadonlyArray<Param> = [], options?: TransactionOptions, sourceMaps: Promise<SourceMaps> = Promise.resolve({})): Promise<TransactionResult<PublishReceipt, InvocationTransaction>>
```
* Publishes and deploys a smart contract to the currently selected network.
<br><br>
```
registerAsset(asset: AssetRegister, options?: TransactionOptions): Promise<TransactionResult<RegisterAssetReceipt, InvocationTransaction>>
```
* Registers a new asset to the currently selected network.
<br><br>
```
issue(amount: BigNumber, asset: Hash256String, to: AddressString, options?: TransactionOptions): Promise<TransactionResult<TransactionReceipt, IssueTransaction>>
```
* Issues a given amount of a given asset to a given address.
<br><br>
```
read(network: NetworkType): ReadClient
```
* Returns a ReadClient for the given network.  The ReadClient is used to obtain information about the blockchain.
<br><br>
```
smartContract<T extends SmartContract>(definition: SmartContractDefinition): T
```
* Creates a smart contract from a given smart contract definition.
<br><br>
```
inject<K>(provider: K extends keyof TUserAccountProviders ? TUserAccountProviders[K]: UserAccountProvider): void
```
* Sets the current User Account Provider to the given provider.
<br><br>
