---
id: client-types
title: Client Types
---
This is the API documentation for the NEO•ONE Client Types.

## Types
  - [Common Types](#common-types)
    - [AddressSting](#AddressString)
    - [Account](#Account)
    - [Asset](#Asset)
    - [AssetRegister](#AssetRegister)
    - [BufferString](#BufferString)
    - [GetOptions](#GetOptions)
    - [Hash256String](#Hash256String)
    - [Input](#Input)
    - [InputOutput](#InputOutput)
    - [NetworkType](#NetworkType)
    - [Output](#Output)
    - [PrivateKeyString](#PrivateKeyString)
    - [PublicKeyString](#PublicKeyString)
    - [SignatureString](#SignatureString)
    - [Transfer](#Transfer)
    - [UserAccount](#UserAccount)
    - [UserAccountID](#UserAccountID)
  - [Contract Types](#contract-types)
    - [Action](#Action)
    - [Contract](#Contract)
    - [ContractParameterType](#ContractParameterType)
    - [ContractRegister](#ContractRegister)
    - [Event](#Event)
    - [EventParameters](#EventParameters)
    - [Log](#Log)
    - [Param](#Param)
    - [ParamArray](#ParamArray)
    - [ParamJSON](#ParamJSON)
    - [Return](#Return)
    - [ReturnArray](#ReturnArray)
    - [StorageItem](#StorageItem)
  - [Transaction Types](#transaction-types)
    - [ClaimTransaction](#ClaimTransaction)
    - [ConfirmedClaimTransaction](#ConfirmedClaimTransaction)
    - [ConfirmedContractTransaction](#ConfirmedContractTransaction)
    - [ConfirmedInvocationTransaction](#ConfirmedInvocationTransaction)
    - [ConfirmedIssueTransaction](#ConfirmedIssueTransaction)
    - [ConfirmedMinerTransaction](#ConfirmedMinerTransaction)
    - [ConfirmedStateTransaction](#ConfirmedStateTransaction)
    - [ConfirmedTransaction](#ConfirmedTransaction)
    - [ConfirmedTransactionBase](#ConfirmedTransactionBase)
    - [ContractTransaction](#ContractTransaction)
    - [InvocationResult](#InvocationResult)
    - [InvocationResultError](#InvocationResultError)
    - [InvocationResultSuccess](#InvocationResultSuccess)
    - [InvocationTransaction](#InvocationTransaction)
    - [InvokeReceipt](#InvokeReceipt)
    - [IssueTransaction](#IssueTransaction)
    - [MinerTransaction](#MinerTransaction)
    - [StateTransaction](#StateTransaction)
    - [Transaction](#Transaction)
    - [TransactionBase](#TransactionBase)
    - [TransactionOptions](#TransactionOptions)
    - [TransactionReceipt](#TransactionReceipt)
    - [TransactionResult](#TransactionResult)
  - [Block Types](#block-types)
    - [Header](#Header)
    - [Block](#Block)
  - [Advanced Types](#advanced-types)
    - [AddressAttributeUsage](#AddressAttributeUsage)
    - [AddressContractParameter](#AddressContractParameter)
    - [ArrayContractParameter](#ArrayContractParameter)
    - [AssetType](#AssetType)
    - [AttributeUsage](#AttributeUsage)
    - [BlockFilter](#BlockFilter)
    - [BooleanContractParameter](#BooleanContractParameter)
    - [BufferAttributeUsage](#BufferAttributeUsage)
    - [BufferContractParameter](#BufferContractParameter)
    - [ContractParameter](#ContractParameter)
    - [Hash256AttributeUsage](#Hash256AttributeUsage)
    - [Hash256ContractParameter](#Hash256ContractParameter)
    - [IntegerContractParameter](#IntegerContractParameter)
    - [InteropInterfaceContractParameter](#InteropInterfaceContractParameter)
    - [NetworkSettings](#NetworkSettings)
    - [PrivateNetworkSettings](#PrivateNetworkSettings)
    - [PublicKeyAttributeUsage](#PublicKeyAttributeUsage)
    - [PublicKeyContractParameter](#PublicKeyContractParameter)
    - [SignatureContractParameter](#SignatureContractParameter)
    - [RawAction](#RawAction)
    - [RawActionBase](#RawActionBase)
    - [RawCallReceipt](#RawCallReceipt)
    - [RawInvocationData](RawInvocationData)
    - [RawInvocationResult](#RawInvocationResult)
    - [RawInvocationResultError](#RawInvocationResultError)
    - [RawInvocationResultSuccess](#RawInvocationResultSuccess)
    - [RawInvokeReceipt](#RawInvokeReceipt)
    - [RawLog](#RawLog)
    - [RawNotification](#RawNotification)
    - [StringContractParameter](#StringContractParameter)
    - [UpdateAccountNameOptions](#UpdateAccountNameOptions)
    - [VoidContractParameter](#VoidContractParameter)
    - [Witness](#Witness)

## Common Types
These are the types you will need for most common used cases.

#### AddressString
  - Base64 encoded string that represents a NEO address.
    ```ts
    'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR'
    ```
  - Also accepts Hash160 strings (hex encoded string prefixed by '0x') when used as a parameter to a to a NEO•ONE function.
    ```ts
    '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9'
    ```

#### Account
  - Contains asset balances for a given address.
  - Properties:
    - address: [AddressString](#AddressString)
    - balances: {[asset: string]: [BigNumber](https://github.com/MikeMcl/bignumber.js/)}

#### Asset
  - Properties
    - hash: [Hash256String](#Hash256String)
       - ID of the Asset
    - type: [AssetType](#AssetType)
    - name: string
       - Name of the Asset
    - amount: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
      - Total possible supply of the Asset
    - available: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
      - Amount currently available of the Asset
    - precision: number
      - Number of decimal places of the Asset
    - owner: [PublicKeyString](#PublicKeyString)
      - Owner of the Asset
    - admin: [AddressString](#AddressString)
       - Admin of the Asset
    - issuer: [AddressString](#AddressString)
      - Issuer of the Asset
    - expiration: number
      - Block at which the Asset expires
    - frozen: boolean
      - Asset is frozen when true

#### AssetRegister
  - Information required to register an [Asset](#Asset).
  - Properties:
    - type: [AssetType](#AssetType)
    - name: string
       - Name of the Asset
    - amount: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
      - Total possible supply of the Asset
    - precision: number
      - Number of decimal places of the Asset
    - owner: [PublicKeyString](#PublicKeyString)
      - Owner of the Asset
    - admin: [AddressString](#AddressString)
       - Admin of the Asset
    - issuer: [AddressString](#AddressString)
      - Issuer of the Asset

#### BufferString
  - Hex encoded string that represents a buffer.
    ```ts
    '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef'
    ```

#### GetOptions
  - Generic options used for different operations.
  - Properties:
    - timeoutMS (optional): number
        - Time before operation timeout

#### Hash256String
  - Hex encoded string prefixed by '0x' that represents a NEO 256 bit hash.
  - Examples of Hash256String include `Block` hashes and[Transaction](#Transaction) hashes.
    ```ts
     '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c'
    ```

#### Input
  - Inputs are a reference to an [Output](#Output) of a [Transaction](#Transaction) that has been persisted to the blockchain.
  - The sum of the values of the referenced [Outputs](#Output) is the total amount transferred in the [Transaction](#Transaction).
  - Properties:
    - hash: [Hash256String](#Hash256String)
      - Hash of the [Transaction](#Transaction) this input references.
    - index: number
      - [Output](#Output) index within the [Transaction](#Transaction) this input references.

#### InputOutput
  - Extension of [Input](#Input) and [Output](#Output).

#### NetworkType
  - String values which denote the Network
    - 'main'
      - The NEO Main network
    - 'test'
      - The NEO Test network
    - string
      - Arbitrary string for the name of a private network

#### Output
  - Outputs represent the destination Address and amount transferred of a given [Asset](#Asset).
  - The sum of the unspent Outputs of an Address represent the total balance of the Address.
  - Properties:
    - asset: [Hash256String](#Hash256String)
      - Hash of the [Asset](#Asset) that was transferred.
    - value: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
      - Amount transferred.
    - address: [AddressString](#AddressString)
      - Destination Address.

#### PrivateKeyString
  - Hex encoded string that represents a signature for a message.
    ```ts
    'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67'
    ```

#### PublicKeyString
  - WIF string that represents a private key.
    ```ts
    'L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g'
    ```
  - Also accepts hex encoded strings when used as a parameter to a NEO•ONE function.
    ```ts
    '9ab7e154840daca3a2efadaf0df93cd3a5b51768c632f5433f86909d9b994a69'
    ```
  - Always a WIF string when returned from a NEO•ONE function.

#### SignatureString
  - Hex encoded string that represents a signature for a message.
    ```ts
    'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67'
    ```

#### Transfer
  - Data required to initiate a transfer of an [Asset](#Asset).
  - Properties:
    - amount: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
      - Amount to transfer.
    - asset: [Hash256String](#Hash256String)
      - Asset to transfer.
    - to: [AddressString](#AddressString)
      - Address where the [Asset](#Asset) is to be transferred.

#### UserAccount
  - Information associated with a UserAccount
  - Properties:
    - type: string
    - id: [UserAccountID(#UserAccountID)
    - name: string
    - publicKey: [PublicKeyString](#PublicKeyString)
    - configurableName: boolean
    - deletable: boolean

#### UserAccountID
  - ID to identify a UserAccount by address and network.
  - Properties:
    - network: [NetworkType](#NeteworkType)
    - address: [AddressString](#AddressString)

<br>
## Contract Types
Types related to Smart Contracts.

#### Action
  - [Event](#Event)
  - [Log](#Log)

#### Contract
  - Definition of a Contract.
  - Properties:
    - version: number
    - address: [AddressString](#AddressString)
      - AddressString of this Contract
    - script: [BufferString](#BufferString)
      - Contract code
    - parameters: ReadonlyArray<[ContractParameterType](#ContractParameterType)>
      - Expected parameters of this Contract.
    - returnType: [ContractParameterType](#ContractParameterType)
      - Return type of this Contract.
    - name: string
      - Name of this Contract. For informational purposes only.
    - codeVersion: string
      - Version of this Contract.  For informational purposes only.
    - author: string
      - Author of this Contract. For informational purposes only.
    - email: string
      - Email of this Contract. For informational purposes only.
    - description: string
      - Description of this Contract. For informational purposes only.
    - storage: boolean
      - True if this contract can use storage
    - dynamicInvoke: boolean
      - True if this Contract can make dynamic invocation.s
    - payable: boolean
      - True if this Contract accepts first-class assets and/or tokens.

#### ContractParameterType
  - All possible values of the type field for [ContractParameter](#ContractParameter)
    ```ts
    'Signature' | 'Boolean' | 'Integer' | 'Address' | 'Hash256' | 'Buffer' | 'PublicKey' | 'String' | 'Array' | 'InteropInterface' | 'Void'
    ```

#### ContractRegister
  - Information required to register a [Contract](#Contract).
  - Properties:
    - script: [BufferString](#BufferString)
      - Contract code
    - parameters: ReadonlyArray<[ContractParameterType](#ContractParameterType)>
      - Expected parameters of this Contract.
    - returnType: [ContractParameterType](#ContractParameterType)
      - Return type of this Contract.
    - name: string
      - Name of this Contract. For informational purposes only.
    - codeVersion: string
      - Version of this Contract.  For informational purposes only.
    - author: string
      - Author of this Contract. For informational purposes only.
    - email: string
      - Email of this Contract. For informational purposes only.
    - description: string
      - Description of this Contract. For informational purposes only.
    - storage: boolean
      - True if this contract can use storage
    - dynamicInvoke: boolean
      - True if this Contract can make dynamic invocation.s
    - payable: boolean
      - True if this Contract accepts first-class assets and/or tokens.

#### Event
  - Extension of [RawActionBase](#RawActionBase).
  - Properties:
    - type: 'Event'
    - name: string
    - parameters: [EventParameters](#EventParameters)

#### EventParameters
  - Parameters associated with an [Event](#Event)
  - Mapping of names to [Params](#Param)

#### Log
  - Extension of [RawActionBase](#RawActionBase).
  - Properties:
    - type: 'Log'
    - message: string

#### Param
  - Valid parameter types for a smart contract function.
    - undefined
    - [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - [BufferString](#BufferString)
    - [AddressString](#AddressString)
    - [Hash256String](#Hash256String)
    - [PublicKeyString](#PublicKeyString)
    - boolean
    - [ParamArray](#ParamArray)
    - [ForwardValue](#ForwardValue)

#### ParamArray
  - Array type allowed to be passed to a smart contract function.
  - ReadonlyArray<[Param](#Param)>

#### ParamJSONArray
  - Array type allowed inside a JSON object passed to a smart contract function.
  - Extension of ReadonlyArray<[Param](#Param)>

#### ParamJSON
  - Valid parameter types inside a JSON object passed to a smart contract function.
    - undefined
    - string
    - [BufferString](#BufferString)
    - [AddressString](#AddressString)
    - [Hash256String](#Hash256String)
    - [PublicKeyString](#PublicKeyString)
    - boolean
    - [ParamJSONArray](#ParamArray)

#### Return
  - Valid return types for a smart contract function.
      - undefined
    - [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - [BufferString](#BufferString)
    - [AddressString](#AddressString)
    - [Hash256String](#Hash256String)
    - [PublicKeyString](#PublicKeyString)
    - boolean
    - [ReturnArray](#ReturnArray)
    - [ContractParameter](#ContractParameter)

#### ReturnArray
  - ReadonlyArray<[Return](#Return)>

#### StorageItem
  - An element in persistent [Conract](#Contract) storage.
  - Properties:
    - address: [AddressString](#AddressString)
      - [Contract](#Contract) Address for this StorageItem.
    - key: [BufferString](#BufferString)
      - Key of this StorageItem.
    - value: [BufferString](#BufferString)
      - Value of this StorageItem.

<br>
## Transaction Types
Types related to Transactions.

#### ClaimTransaction
  - Extension of [TransactionBase](#TransactionBase).
  - Claim GAS for a set of spent [Outputs](#Output)
  - Properties:
    - type: 'ClaimTransaction'
    - claims: ReadonlyArray<[Input](#Input)>

#### ConfirmedClaimTransaction
  - Extension of [ConfirmedTransactionBase](#ConfirmedTransactionBase) and [ClaimTransaction](#ClaimTransaction).

#### ConfirmedContractTransaction
  - Extension of [ConfirmedTransactionBase](#ConfirmedTransactionBase) and [ContractTransaction](#ContractTransaction).

#### ConfirmedInvocationTransaction
  - Extension of [ConfirmedTransactionBase](#ConfirmedTransactionBase) and [InvocationTransaction](#InvocationTransaction).
  - Properties:
    - invocationData: [RawInvocationData](#RawInvocationData)

#### ConfirmedIssueTransaction
  - Extension of [ConfirmedTransactionBase](#ConfirmedTransactionBase) and [IssueTransaction](#IssueTransaction).

#### ConfirmedMinerTransaction
  - Extension of [ConfirmedTransactionBase](#ConfirmedTransactionBase) and [MinerTransaction](#MinerTransaction).

#### ConfirmedStateTransaction
  - Extension of [ConfirmedTransactionBase](#ConfirmedTransactionBase) and [StateTransaction](#StateTransaction).

#### ConfirmedTransaction
  - [ConfirmedMinerTransaction](#ConfirmedMinerTransaction)
  - [ConfirmedIssueTransaction](#ConfirmedIssueTransaction)
  - [ConfirmedClaimTransaction](#ConfirmedClaimTransaction)
  - [ConfirmedContractTransaction](#ConfirmedContractTransaction)
  - [ConfirmedStateTransaction](#ConfirmedStateTransaction)
  - [ConfirmedInvocationTransaction](#ConfirmedInvocationTransaction)

#### ConfirmedTransactionBase
  - Base interface for all confirmed [Transactions](#Transaction).
  - Properties:
    - receipt:
      - blockHash: [Hash256String](#Hash256String)
      - blockIndex: number
      - index: number
      - globalIndex: [BigNumber](https://github.com/MikeMcl/bignumber.js/)

#### ContractTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - Transfer of first-class [Assets](#Asset)
  - Properties:
    - type: 'ContractTransaction'

#### InvocationResult
  - Result of an invocation.
    - [InvocationResultError](#InvocationResultError)
    - [InvocationResultSuccess](#InvocationResultSuccess)

#### InvocationResultError
  - Result of a failed invocation.
  - Properties:
    - state: 'FAULT'
    - gasConsumed: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - gasCost: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - message: string

#### InvocationResultSuccess
  - Result of a successful invocation.
  - Properties:
    - state: 'HALT'
    - gasConsumed: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - gasCost: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - value: Return Value of the Invocation

#### InvocationTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - Runs a script in the NEO-VM.
  - Properties:
    - type: 'InvocationTransaction'
    - script: [BufferString](#BufferString)
    - gas: [BigNumber](https://github.com/MikeMcl/bignumber.js/)

#### InvokeReceipt
  - Extension of [TransactionReceipt](#TransactionReceipt) for invocations.
  - Properties:
    - result: [InvocationResult](#InvocationResult)
    - events: ReadonlyArray<[Event](#Event)>
    - logs: ReadonlyArray<[Log](#Log)>

#### IssueTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - Issues new currency of a first-class [Asset](#Asset).
  - Properties:
    - type: 'IssueTransaction'

#### MinerTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - First [Transaction](#Transaction) in each block which contains the Block rewards for the consensus node that produced the Block.
  - Properties:
    - type: 'MinerTransaction'
    - nonce: number

#### StateTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - Properties:
    - type: 'StateTransaction'

#### Transaction
  - [MinerTransaction](#MinerTransaction)
  - [IssueTransaction](#IssueTransaction)
  - [ClaimTransaction](#ClaimTransaction)
  - [ContractTransaction](#ContractTransaction)
  - [StateTransaction](#StateTransaction)
  - [InvocationTransaction](#InvocationTransaction)

#### TransactionBase
  - Base interface for all Transactions.
  - Properties:
    - version: number
    - hash: [Hash256String](#Hash256String)
      - Hash256 of this Transaction
    - size: number
      - Byte size of this Transaction
    - Attributes: ReadonlyArray<[Attribute](#Attribute)>
      - Attributes attached to the transaction
    - inputs: ReadonlyArray<[Input](#Input)>
      - Inputs of the Transaction.
    - outputs: ReadonlyArray<[Output](#Output)>
      - Outputs of the Transaction.
    - scripts: ReadonlyArray<[Witness](#Witness)>
    - systemFee: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
      - Fee for invoking a smart contract.
    - networkFee: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
      - Fee attached to a transaction to increase chances of getting it through quickly.

#### TransactionOptions
  - Options available when submitting a [Transaction](#Transaction) or [Transfer](#Transfer).
  - Properties (All optional):
    - from: [UserAccountID](#UserAccountID)
      - Account to transfer assets from. If this is not provided, the client's current account will be used.
    - attributes: ReadonlyArray<[Attribute](#Attribute)>
      - Attributes to attach to the transaction.
    - networkFee: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
      - Fee attached to a transaction to increase chances of getting it through quickly.
    - systemFee: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
      - Fee for invoking a smart contract.

#### TransactionReceipt
  - Receipt of a confirmed [Transaction](#Transaction) which contains data about the confirmation such as the Block index and the index of the [Transaction](#Transaction) within the block.
  - Properties:
    - blockIndex: number
      - Block index of the [Transaction](#Transaction) for this receipt.
    - blockHash: [Hash256String](#Hash256String)
      - Block hash of the [Transaction](#Transaction) for this receipt.
    - transactionIndex: number
      - Transaction index of the [Transaction](#Transaction) within the Block for this Receipt.

#### TransactionResult
  - Result of a [Transaction](#Transaction)
  - Properties:
    - transaction: [Transaction](#Transction)
      - [Transaction](#Transaction) send to the network.
    - confirmed: (options?: [GetOptions](#GetOptions)) => Promise<[TransactionReceipt](#TransactionReceipt)>
      - Function which must be called to confirm the [Transaction](#Transaction) made it into a [Block](#Block).

<br>
## Block Types

#### Block
  - Extension of [Header](#Header).
  - Information contained in a Block.
  - Properties:
    - transactions: ReadonlyArray<[ConfirmedTransaction](#ConfirmedTransaction)>
      - Transactions contained in the Block.

#### Header
  - Base information about a [Block](#Block).
  - Properties:
    - version: number
      - NEO blockchain version.
    - hash: [Hash256String](#Hash256String)
      - [Block](#Block) hash
    - previousBlockHash: [Hash256String](#Hash256String)
    - merkleRoot: [Hash256String](#Hash256String)
    - time: number
      - [Block](#Block) time persisted
    - index: number
      - [Block](#Block) index
    - nonce: string
    - nextConsensus: [AddressString](#AddressString)
      - Next consensus address.
    - script: [Witness](#Witness)
    - size: number
      - Size in bytes of the [Block](#Block)

<br>
## Advanced Types
The rest of the types are contained here.  These will likely only be used for more advanced use cases.

#### AddressAttributeUsage
  - Attribute usage flag indicating the data is a PublicKey
    ```ts
    'Script'
    ```

#### AddressContractParameter
  - Invocation stack item for an Address
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'Address'
    - value: [AddressString](#AddressString)

#### ArrayContractParameter
  - Invocation stack item for an Array
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'Array'
    - value: ReadonlyArray<[ContractParameter](#ContractParameter)>

#### AssetType
  - An enum of string values of all possible Asset Types
    ```ts
    'Credit' | 'Duty' | 'Governing' | 'Utility' | 'Currency' | 'Share' | 'Invoice' | 'Token'
    ```

#### AttributeUsage
  - Attribute usage flag indicates the type of the data.
    - [BufferAttributeUsage](#BufferAttributeUsage)
    - [AddressAttributeUsage](#AddressAttributeUsage)
    - [PublicKeyAttributeUsage](#PublicKeyAttributeUsage)
    - [Hash256AttributeUsage](#Hash256AttributeUsage)


#### BlockFilter
  - Filter user in certain methods which iterate over blocks.
  - Properties (All optional):
    - indexStart: number
    - indexStop: number

#### BooleanContractParameter
  - Invocation stack item for boolean
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'Boolean'
    - value: boolean

#### BufferAttributeUsage
  - Attribute usage flag indicating the data is an arbitrary Buffer
    ```ts
    'DescriptionUrl' | 'Description' | 'Remark' | 'Remark1' | 'Remark2' | 'Remark3' | 'Remark4' | 'Remark5' | 'Remark6' | 'Remark7' | 'Remark8' | 'Remark9' | 'Remark10' | 'Remark11' | 'Remark12' | 'Remark13' | 'Remark14' | 'Remark15'
    ```

#### BufferContractParameter
  - Invocation stack item for a Buffer
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'Buffer'
    - value: [BufferString](#BufferString)

#### ContractParameter
  - ContractParameters are the serialized stack items of an invocation. These are typically the raw results of an invocation, but they may appear in other raw contexts.
    - [SignatureContractParameter](#SignatureContractParameter)
    - [BooleanContractParameter](#BooleanContractParameter)
    - [IntegerContractParameter](#IntegerContractParameter)
    - [AddressContractParameter](#AddressContractParameter)
    - [Hash256ContractParameter](#Hash256ContractParameter)
    - [BufferContractParameter](#BufferContractParameter)
    - [PublicKeyContractParameter](#PublicKeyContractParameter)
    - [StringContractParameter](#StringContractParameter)
    - [ArrayContractParameter](#ArrayContractParameter)
    - [InteropInterfaceContractParameter](#InteropInterfaceContractParameter)
    - [VoidContractParameter](#VoidContractParameter)

#### Hash256AttributeUsage
  - Attribute usage flag indicating the data is a Hash256
    ```ts
    'ContractHash' | 'Vote' | 'Hash1' | 'Hash2' | 'Hash3' | 'Hash4' | 'Hash5' | 'Hash6' | 'Hash7' | 'Hash8' | 'Hash9' | 'Hash10' | 'Hash11' | 'Hash12' | 'Hash13' | 'Hash14' | 'Hash15'
    ```

#### Hash256ContractParameter
  - Invocation stack item for Hash256
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'Hash256'
    - value: [Hash256String](#Hash256String)

#### IntegerContractParameter
  - Invocation stack item for a BN
  - Note that unlike most of the client APIs, we use a `BN` instead of a `BigNumber` here to indicate that this is an integer value.
  - For example, an `IntegerContractParameter` that represents a NEO value of 10 would be
    ```ts
    new BN(10_00000000)
    ```
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'Boolean'
    - value: boolean

#### InteropInterfaceContractParameter
  - Invocation stack item for anything other than the other valid contract parameters.
  - Examples include the `Block` builtin. If these builtins remain on the stack after invocation, for example, as a return value, then they will be serialized as this empty interface.
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'InteropInterface'

#### NetworkSettings
  - Settings of the network.
  - Properties:
    - issueGASFee: [BigNumber](https://github.com/MikeMcl/bignumber.js/)

#### PrivateNetworkSettings
  - Settings specific to a private network.
  - Properties:
    - secondsPerBlock: number

#### PublicKeyAttributeUsage
  - Attribute usage flag indicating the data is a PublicKey
    ```ts
    'ECDH02' | 'ECDH03'
    ```

#### PublicKeyContractParameter
  - Invocation stack item for PublicKey
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'PublicKey'
    - value: [PublicKeyString](#PublicKeyString)

#### SignatureContractParameter
  - Invocation stack item for Signature
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'Signature'
    - value: [SignatureString](#SignatureString)

#### RawAction
  - Raw action emitted during an invocation.
    - [RawNotification](#RawNotification)
    - [RawLog](#RawLog)
  - Low-level API for advanced usage only.

#### RawActionBase
  - Raw action emitted during an invocation.
  - Low-level API for advanced usage only.
  - Properties:
    - version: number
    - blockIndex: number
    - blockHash: [Hash256String](#Hash256String)
    - transactionIndex: number
    - transactionHash: [Hash256String](#Hash256String)
    - index: number
    - globalIndex: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - address: [AddressString](#AddressString)

#### RawCallReceipt
  - Raw receipt of an invocation.
  - Low-level API for advanced usage only.
  - Properties:
    - result: [RawInvocationResult](#RawInvocationResult)
    - actions: ReadonlyArray<[RawAction](#RawAction)>

#### RawInvocationData
  - Raw data about an invocation.
  - Low-level API for advanced usage only.
  - Properties:
    - asset: [Asset](#Asset)
    - contracts: ReadonlyArray<[Contract](#Contract)>
    - deletedContractAddresses: ReadonlyArray<[AddressString](#AddressString)>
    - migratedContractAddresses: ReadonlyArray<[[AddressString](#AddressString), [AddressString](#AddressString)]>
    - result: [RawInvocationResult](#RawInvocationResult)
    - actions: ReadonlyArray<[RawAction](#RawAction)>

#### RawInvocationResult
  - Raw result of an invocation.
    - [RawInvocationResultError](#RawInvocationResultError)
    - [RawInvocationResultSuccess](#RawInvocationResultSuccess)
  - Low-level API for advanced usage only.

#### RawInvocationResultError
  - Raw result of a failed invocation.
  - Low-level API for advanced usage only.
  - Properties
    - state: 'FAULT'
    - gasConsumed: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - gasCost: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - stack: ReadonlyArray<[ContractParameter](#ContractParameter)>
    - message: string

#### RawInvocationResultSuccess
  - Raw result of a successful invocation.
  - Low-level API for advanced usage only.
  - Properties
    - state: 'HALT'
    - gasConsumed: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - gasCost: [BigNumber](https://github.com/MikeMcl/bignumber.js/)
    - stack: ReadonlyArray<[ContractParameter](#ContractParameter)>

#### RawInvokeReceipt
  - Extension of [TransactionReceipt](#TransactionReceipt)
  - Raw receipt of an invocation.
  - Low-level API for advanced usage only.
  - Properties:
    - result: [RawInvocationResult](#RawInvocationResult)
    - actions: ReadonlyArray<[RawAction](#RawAction)>

#### RawLog
  - Extension of [RawActionBase](#RawActionBase)
  - Raw log emitted during an invocation.
  - Low-level API for advanced usage only.
  - Properties:
    - type: 'Log'
    - message: string

#### RawNotification
  - Extension of [RawActionBase](#RawActionBase)
  - Raw notification emitted during an invocation.
  - Low-level API for advanced usage only.
  - Properties:
    - type: 'Notification'
    - args: ReadonlyArray<[ContractParameter](#ContractParameter)>

#### StringContractParameter
  - Invocation stack item for string
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'String'
    - value: string

#### UpdateAccountNameOptions
  - Options for updating a [UserAccount](#UserAccount) name.
  - Properties:
    - id: [UserAccountID](#UserAccountID)
      - ID of account to change name.
    - name: string
      - Name to change to.

#### VoidContractParameter
  - Invocation stack item for void
  - See [ContractParameter](#ContractParameter)
  - Properties
    - type: 'Void'

#### Witness
  - Properties:
    - invocation: [BufferString](#BufferString)
    - verification: [BufferString](#BufferString)
