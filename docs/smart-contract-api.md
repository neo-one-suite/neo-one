---
id: smart-contract-api
title: Smart Contract API
---

This is the API documentation for NEO•ONE Smart Contracts. This includes all types and utilities available to import into your Smart Contract definition files from `@neo-one/smart-contract`.

## API
  - [Address](#Address)
  - [Hash256](#Hash256)
  - [PublicKey](#PublicKey)
  - [Fixed\<Decimal\>](#Fixed)
  - [Integer](#Integer)
  - [Fixed8](#Fixed8)
  - [TransactionType](#TransactionType)
  - [AttributeUsage](#AttributeUsage)
  - [BufferAttributeUsage](#BufferAttributeUsage)
  - [PublicKeyAttributeUsage](#PublicKeyAttributeUsage)
  - [AddressAttributeUsage](#AddressAttributeUsage)
  - [Hash256AttributeUsage](#Hash256AttributeUsage)
  - [AttributeBase](#AttributeBase)
  - [BufferAttribute](#BufferAttribute)
  - [PublicKeyAttribute](#PublicKeyAttribute)
  - [AddressAttribute](#AddressAttribute)
  - [Hash256Attribute](#Hash256Attribute)
  - [Attribute](#Attribute)
  - [Output](#Output)
  - [Input](#Input)
  - [TransactionBase](#TransactionBase)
  - [MinerTransaction](#MinerTransaction)
  - [IssueTransaction](#IssueTransaction)
  - [ClaimTransaction](#ClaimTransaction)
  - [ContractTransaction](#ContractTransaction)
  - [StateTransaction](#StateTransaction)
  - [InvocationTransaction](#InvocationTransaction)
  - [Transaction](#Transaction)
  - [Account](#Account)
  - [AssetType](#AssetType)
  - [Asset](#Asset)
  - [Contract](#Contract)
  - [Header](#Header)
  - [Block](#Block)
  - [SerializableKeySingle](#SerializableKeySingle)
  - [SK](#SK)
  - [SerializableKey](#SerializableKey)
  - [SerlializableValue](#SerlializableValue)
  - [ArrayStorage](#ArrayStorage)
  - [MapStorage](#MapStorage)
  - [SetStorage](#SetStorage)
  - [Blockchain](#Blockchain)
  - [Deploy](#Deploy)
  - [ContractProperties](#ContractProperties)
  - [SmartContract](#SmartContract)
  - [LinkedSmartContract](#LinkedSmartContract)
  - [Hashable](#Hashable)
  - [Crypto](#Crypto)
  - [constant](#constant)

#### Address
  - Buffer that represents a NEO address.
  - Stored as a script hash (Hash160) internally.
  - Methods:
    - isCaller: (Address) => boolean;
      - Verifies that the invocation was directly called AND approved by the given Address.
      - Smart contracts should invoke this function before taking transferring items for Addresses, like transferring tokens, that require the permission of the Address.
      - Example:
        ```ts
        if (!Address.isCalled(inputAddress)) {
          return false;
        }
        ```
    - isSender: (Address) => boolean;
      - Verifies that the [Transaction](#Transaction) was signed by the address.
      - In most cases, smart contracts should instead use.
       `Address.isCaller`.
      - Example:
        ```ts
        if (!Address.isSender(address)) {
          return false;
        }
        ```
  - Constructor:
    - from: (string) => Address;
      - Creates an Address from a literal string.
      - Accepts either a NEO address or a script hash.
      - Example:
        ```ts
        const accountAddress = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
        const contractAddress = Address.from('​​​​​0xcef0c0fdcfe7838eff6ff104f9cdec2922297537​​​​​');
        ```
  - Example Type Usage:
    ```ts
    @constant
    public checkBalance(address: Address): Integer {
      // checks balance
    };
    ```

#### Hash256
  - Buffer that represents a NEO 256 bit hash.
  - Examples of Hash256 include [Block](#Block) hashes, [Transaction](#Transaction) hashes, and [Asset](#Asset) hashes.
  - Properties:
    - NEO
      - Hash256 of the NEO [Asset](#Asset).
      - Example:
        ```ts
        sendAsset(fromAddress, toAddress, Hash256.NEO);
        ```
    - GAS
      - Hash256 of the GAS [Asset](#Asset).
      - Example:
        ```ts
        sendAsset(fromAddress, toAddress, Hash256.GAS);
        ```
  - Constructor:
    - from: (string) => Hash256;
      - Creates a Hash256 from a literal string.
      - Example:
        ```ts
        const transactionHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb')
        ```
  - Example Type Usage:
    ```ts
    public sendAsset(from: Address, to: Address, asset: Hash256): boolean {
      // sends given asset represented by its Hash256 identifier.
    };
    ```

#### PublicKey
  - Buffer that represents a public key.
  - Constructor:
    - from: (string) => PublicKey
      - Creates a PublicKey from a literal string.
      - Example:
        ```ts
        const publicKey = PublicKey.from('02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef')
        ```
  - Example Type Usage:
    ```ts
    public publicKeyToAddress(publicKey: PublicKey): Address {
      // converts public key to address
    }
    ```

<a id="Fixed"></a>
#### Fixed\<Decimal extends number\>
  - Integer which represents a number with the specified decimals.
  - Example Type Usage:
    ```ts
    // 100.0000
    public readonly tokenConversionRate: Fixed<4>: 100_0000;
    // 10,000,000,000.00000000
    public readonly remainingTokens: Fixed<8>: 10_000_000_000_00000000;
    ```

#### Integer
  - Integer that represents a number with 0 decimals.
  - Shorthand for Fixed<0>.
  - Example Type Usage:
    ```ts
    public readonly icoDurationSeconds: Integer = 86400;
    ```

#### Fixed8
  - Integer that represents a number with 8 decimals.
  - Shorthand for Fixed<8>.
  - Example Type Usage:
    ```ts
    public gasBalance(address: Address): Fixed8 {
      // returns GAS balance of address
    }
    ```

#### TransactionType
  - enum of all [Transaction](#Transaction) Types.
    - Miner = 0x00
      - First [Transaction](#Transaction) in each block which contains the Block rewards for the consensus node that produced the Block.
      - Example:
        ```ts
        if(transaction.type === TransactionType.Miner) {
          // do something
        }
        ```
    - Issue = 0x01
      - Issues new currency of a first-class [Asset](#Asset).
      - Example:
        ```ts
        if(transaction.type === TransactionType.Issue) {
          // do something
        }
        ```
    - Claim = 0x02
      - Claims GAS for a set of spent Outputs.
      - Example:
        ```ts
         if(transaction.type === TransactionType.Claim) {
          // do something
        }
        ```
    - Contract = 0x80
      - Transfers first class [Assets](#Asset).
      - Example:
        ```ts
         if(transaction.type === TransactionType.Contract) {
          // do something
        }
        ```
    - State  = 0x90
      - State Transaction type.
      - Example:
        ```ts
         if(transaction.type === TransactionType.State) {
          // do something
        }
        ```
    - Publish = 0xd0
      - Registers a new Contract
      - Example:
        ```ts
         if(transaction.type === TransactionType.Publish) {
          // do something
        }
        ```
    - Invocation = 0xd1
      - Runs a script in the NEO-VM.
      - Example:
        ```ts
         if(transaction.type === TransactionType.Invocation) {
          // do something
        }
        ```

#### AttributeUsage
  - Attribute usage flags indicate the type of the data.
    - ContractHash = 0x00
    - ECDH02 = 0x02
    - ECDH03 = 0x03
    - Script = 0x20
    - Vote = 0x30
    - DescriptionUrl = 0x81
    - Description = 0x90
    - Hash1 = 0xa1
    - Hash2 = 0xa2
    - Hash3 = 0xa3
    - Hash4 = 0xa4
    - Hash5 = 0xa5
    - Hash6 = 0xa6
    - Hash7 = 0xa7
    - Hash8 = 0xa8
    - Hash9 = 0xa9
    - Hash10 = 0xaa
    - Hash11 = 0xab
    - Hash12 = 0xac
    - Hash13 = 0xad
    - Hash14 = 0xae
    - Hash15 = 0xaf
    - Remark = 0xf0
    - Remark1 = 0xf1
    - Remark2 = 0xf2
    - Remark3 = 0xf3
    - Remark4 = 0xf4
    - Remark5 = 0xf5
    - Remark6 = 0xf6
    - Remark7 = 0xf7
    - Remark8 = 0xf8
    - Remark9 = 0xf9
    - Remark10 = 0xfa
    - Remark11 = 0xfb
    - Remark12 = 0xfc
    - Remark13 = 0xfd
    - Remark14 = 0xfe
    - Remark15 = 0xff
  - See:
    - [BufferAttributeUsage](#BufferAttributeUsage)
    - [PublicKeyAttributeUsage](#PublicKeyAttributeUsage)
    - [AddressAttributeUsage](#AddressAttributeUsage)
    - [Hash256AttributeUsage](#Hash256AttributeUsage)

#### BufferAttributeUsage
  - Attribute usage flag indicating the data is an arbitrary Buffer.
    - AttributeUsage.DescriptionUrl
    - AttributeUsage.Description
    - AttributeUsage.Remark
    - AttributeUsage.Remark1 ... AttributeUsage.Remark15
  - See [BufferAttribute](#BufferAttribute).

#### PublicKeyAttributeUsage
  - Attribute usage flag indicating the data is a [PublicKey](#PublicKey).
    - AttributeUsage.ECDH02
    - AttributeUsage.ECDH03
  - See [PublicKeyAttribute](#PublicKeyAttribute)

#### AddressAttributeUsage
  - Attribute usage flag indicating the data is an [Address](#Address).
    - AttributeUsage.Script
  - See [AddressAttribute](#AddressAttribute)

#### Hash256AttributeUsage
  - Attribute usage flag indicating the data is a [Hash256](#Hash256).
    - AttributeUsage.ContractHash
    - AttributeUsage.Vote
    - AttributeUsage.Hash1 ... AttributeUsage.Hash15

#### AttributeBase
  - Base interface for [Attributes](#Attribute).
  - Properties:
    - usage: [AttributeUsage](#AttributeUsage)
      - Attribute usage flag indicating the type of the data
    - data: Buffer
      - The raw data stored in the Attribute

#### BufferAttribute
  - [Attribute](#Attribute)  whose data is an arbitrary Buffer.
  - Extension of [AttributeBase](#AttributeBase).
  - Properties:
    - usage: [BufferAttributeUsage](#BufferAttributeUsage)
    - data: Buffer

#### PublicKeyAttribute
  - [Attribute](#Attribute)  whose data is a [PublicKey](#PublicKey).
  - Extension of [AttributeBase](#AttributeBase).
  - Properties:
    - usage: [PublicKeyAttributeUsage](#PublicKeyAttributeUsage)
    - data: [PublicKey](#PublicKey)

#### AddressAttribute
  - [Attribute](#Attribute)  whose data is an [Address](#Address).
  - Extension of [AttributeBase](#AttributeBase).
  - Properties:
    - usage: [AddressAttributeUsage](#AddressAttributeUsage)
    - data: [Address](#Address)

#### Hash256Attribute
  - [Attribute](#Attribute) whose data is a [Hash256](#Hash256).
  - Extension of [AttributeBase](#AttributeBase).
  - Properties:
    - usage: [Hash256AttributeUsage](#Hash256AttributeUsage)
    - data: [Hash256](#Hash256)

#### Attribute
  - Attributes are used to store additional data on [Transactions](#Transaction).
    - [BufferAttribute](#BufferAttribute)
    - [PublicKeyAttribute](#PublicKeyAttribute)
    - [AddressAttribute](#AddressAttribute)
    - [Hash256Attribute](#Hash256Attribute)
  - Most attributes are used to store arbitrary data, whereas some, like [AddressAttribute](#AddressAttribute), have specific uses in the NEO protocol.

#### Output
  - Outputs represent the destination [Address](#Address) and amount transferred of a given [Asset](#Asset).
  - The sum of the unspent Outputs of an [Address](#Address) represent the total balance of an [Address](#Address).
  - Properties:
    - address: [Address](#Address)
      - Destination [Address](#Address)
    - asset: [Hash256](#Hash256)
      - Hash of the [Asset](#Asset) that was tranferred.
    - value: [Fixed8](#Fixed8)
      - Amount transferred.
  - Example:
    ```ts
    private checkNEOBalance(address: Address, outputs: ReadonlyArray<Output>): Fixed8 {
      let amount = 0;
      for (const output of outputs) {
        if (output.address === address) {
          if (output.asset === Hash256.NEO) {
            amount += output.value;
          }
        }
      }

      return amount;
    };
    ```

#### Input
  - Inputs are a reference to an [Output](#Output) of a [Transaction](#Transaction) that has been persisted to the blockchain.
  - The sum of the value of the referenced [Outputs](#Output) is the total amount transferred in the [Transaction](#Transaction).
  - Properties:
    - hash: [Hash256](#Hash256)
      - Hash of this [Transaction](#Transaction).
    - index: [Integer](#Integer)
      - [Output](#Output) index within the [Transaction](#Transaction) this input references.


#### TransactionBase
  - Base interface for all [Transactions](#Transaction).
  - Properties:
    - hash: [Hash256](#Hash256)
      - [Hash256](#Hash256) of the Transaction.
    - type: [TransactionType](#TransactionType)
      - Type of the Transaction.
    - attributes: [Attribute](#Attribute)[ ]
      - [Attributes](#Attribute) attached to the Transaction.
    - outputs: [Output](#Output)[ ]
      - [Outputs](#Output) of the Transaction.
    - inputs: [Input](#Input)[ ]
      - [Inputs](#Input) of the Transaction.
    - references: [Output](#Output)[ ]
      - Corresponding [Outputs](#Output) for the [Inputs](#Input) of the Transaction.
    - unspentOutputs: [Output](#Output)[ ]
      - [Outputs](#Output) which have not been spent.

#### MinerTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - First Transaction in each block which contains the Block rewards for the consensus node which produced the Block.
  - Properties:
    - type: [TransactionType.Miner](#TransactionType)

#### IssueTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - Issues new currency of a first-class [Asset](#Asset).
  - Properties:
    - type: [TransactionType.Issue](#TransactionType)

#### ClaimTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - Claims GAS for a set of spent [Outputs](#Output).
  - Properties:
    - type: [TransactionType.Claim](#TransactionType)

#### ContractTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - [Transaction](#Transaction) that transfers first class [Assets](#Asset).
  - Properties:
    - type: [TransactionType.Contract](#TransactionType)

#### StateTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - Properties:
    - type: [TransactionType.State](#TransactionType)

#### InvocationTransaction
  - Extension of [TransactionBase](#TransactionBase)
  - [Transaction](#Transaction) which runs a script in the NEO-VM.
  - Properties:
    - type: [TransactionType.Invocation](#TransactionType)
    - script: Buffer
      - Code that was executed in the NEO-VM.

#### Transaction
  - Transactions are persisted to the blockchain and represent various functionality like transferring first class [Assets](#Asset) or executing smart contracts.
    - [MinerTransaction](#MinerTransaction)
    - [IssueTransaction](#IssueTransaction)
    - [ClaimTransaction](#ClaimTransaction)
    - [ContractTransaction](#ContractTransaction)
    - [StateTransaction](#StateTransaction)
    - [InvocationTransaction](#InvocationTransaction)
  - Constructor:
    - for: ([Hash256](#Hash256)) => Transaction
  - Example:
    ```ts
    const transactionHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
    const transaction = Transaction.for(transactionHash);
    const transactionOutputs = transaction.outputs;
    ```

#### Account
  - Object which stores an [Address](#Address) and a method for checking its balances.
  - Properties:
    - address: [Address](#Address)
      - [Address](#Address) of the Account.
  - Methods:
    - getBalance: ([Hash256](#Hash256)) => [Fixed8](#Fixed8)
      - Retrieves the balance of a first class [Asset](#Asset) for the Account's [Address](#Address).
  - Constructor:
    - for: ([Address](#Address)) => Account
      - Returns an Account for the specified [Address](#Address).
  - Example:
    ```ts
    const address = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
    const account = Account.for(address);
    const neoBalance = account.getBalance(Hash256.NEO);
    ```

#### AssetType
  - enum of all possible types for [Assets](#Asset).
    - Credit = 0x40
    - Duty = 0x80
    - Governing = 0x00
      - Reserved for the NEO [Asset](#Asset).
    - Utility = 0x01
      - Reserved for the GAS [Asset](#Asset).
    - Currency = 0x08
    - Share = 0x90
    - Invoice = 0x98
    - Token = 0x60

#### Asset
  - Attributes of a first-class Asset.
  - Smart Contract authors will typically only interact with the NEO and GAS Assets.
  - Properties:
    - hash: [Hash256](#Hash256)
      - [Hash256](#Hash256) of the Asset.
    - type: [AssetType](#AssetType)
      - Type of the Asset which denotes its function.
    - amount: [Fixed8](#Fixed8)
      - Total possible supply of the Asset.
    - available: [Fixed8](#Fixed8)
      - Amount currently available of the Asset.
    - precision: [Integer](#Integer)
      - Precision (number of decimal places) of the Asset.
    - owner: [PublicKey](#PublicKey)
      - Owner of the Asset.
    - admin: [Address](#Address)
      - Admin of the Asset.
    - issuer: [Address](#Address)
      - Issuer of the Asset.
  - Constructor:
    - for: (hash: [Hash256](#Hash256)) => Asset
      - Returns an Asset for the specified hash.
  - Example:
    ```ts
    const neoAsset = Asset.for(Hash256.NEO);
    const neoAmount = neoAsset.amount;
    ```

#### Contract
  - Attributes of a smart contract deployed to the blockchain.
  - Properties:
    - script: Buffer
      - Contract code.
    - payable: boolean
      - Flag that indicates if the Contract supports receiving [Assets](#Asset) and NEP-5 tokens.
  - Constructor:
    - for: (address: [Address](#Address)) => Contract | undefined
      - Returns a Contract for the specified [Address](#Address).
      - Returns undefined if a Contract does not exist at the specified [Address](#Address).
  - Example:
    ```ts
    const contractAddress = Address.from('​​​​​0xcef0c0fdcfe7838eff6ff104f9cdec2922297537​​​​​');
    const contract = Contract.for(contractAddress);
    const contractScript = contract.script;
    ```

#### Header
  - Attributes of a [Block](#Block) persisted to the blockchain.
  - Header includes all information except for the [Transactions](#Transaction).
  - Properties:
    - hash: [Hash256](#Hash256)
      - [Block](#Block) hash.
    - version: [Integer](#Integer)
      - NEO blockchain version.
    - previousHash: [Hash256](#Hash256)
      - hash of the previous [Block](#Block).
    - index: [Integer](#Integer)
      - [Block](#Block) index.
    - merkleRoot: [Hash256](#Hash256)
    - time: [Integer](#Integer)
      - [Block](#Block) time persisted.
    - nextConsensus: [Address](#Address)
      - Next consensus [Address](#Address).
  - Constructor:
    - for: ([Hash256](#Hash256) | [Integer](#Integer)) => Header
      - Accepts either a [Hash256](#Hash256) representing a [Block](#Block) hash or the index of the [Block](#Block).
      - Returns a Header for the specified block hash or index.
  - Example:
    ```ts
    const blockHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
    const header = Header.for(blockHash);
    const nextConsensusAddress = header.nextConsensus;
    ```

#### Block
  - Attributes of a Block persisted to the blockchain.
  - Extension of [Header](#Header).
  - Properties:
    - transactions: [Transaction](#Transaction)[]
      - [Transactions](#Transaction) included in the Block.
  - Constructor:
    - for: ([Hash256](#Hash256) | [Integer](#Integer)) => Block;
      - Accepts either a [Hash256](#Hash256) representing a Block hash or the index of the Block.
      - Returns a Block for the specified block hash or index.
  - Example:
    ```ts
    const genesisBlock = Block.for(0);
    ```

#### SerializableKeySingle
  - Possible single key types for [MapStorage](#MapStorage) and [SetStorage](#SetStorage).
    - number
    - string
    - boolean
    - Buffer

#### SerializableKey
  - Possible key types for [MapStorage](#MapStorage) and [SetStorage](#SetStorage).  This includes single key values ([SerializableKeySingle](#SerializableKeySingle)) and collections of single key values. Supports collections of up to four single key values.
    - [SK](#SerializableKeySingle)
    - [[SK](#SerializableKeySingle), [SK](#SerializableKeySingle)]
    - [[SK](#SerializableKeySingle), [SK](#SerializableKeySingle), [SK](#SerializableKeySingle)]
    - [[SK](#SerializableKeySingle), [SK](#SerializableKeySingle), [SK](#SerializableKeySingle), [SK](#SerializableKeySingle)]

#### SerlializableValue
  - Possible value types for [ArrayStorage](#ArrayStorage) and [MapStorage](#MapStorage).
    - undefined
    - null
    - number
    - string
    - boolean
    - Buffer
    - SerializableValue Array
    - SerializableValue Map
    - SerializableValue Set

#### ArrayStorage
  - Persistent smart contract array storage.
  - Only usable as a [SmartContract](#SmartContract) property.
  - Properties:
    - length: number
      - The length of the array. This is a number one higher than the index of last element defined in the array.
  - Methods:
    - forEach: (callback: (value: T, idx: number) => void) => void
      - Executes a provided callback function once per each value in storage.
    - push: (...items: T[ ]) => number
      - Appends new elements to storage and returns the new length of the array.
    - pop: () => T | undefined;
      - Removes the last element from an array and returns it.
  - Constructor:
    - for<T extends [SerializableValue](#SerializableValue)>(): ArrayStorage<T>
      - Constructs a new ArrayStorage instance.  Only usable as a [SmartContract](#SmartContract) property.
  - Example:
    ```ts
    class MySmartContract extends SmartContract {
      private readonly pendingAddresses = ArrayStorage.for<Address>();

        public addPendingAddress(address: Address): void {
          this.pendingAddresses.push(address);
        }
    }
    ```

#### MapStorage
  - Persistent smart contract map storage.
  - Only usable as a [SmartContract](#SmartContract) property.
  - Methods:
    - forEach(callback: (value: V, key: K) => void) => void
      - Executes a provided function once per each key/value pair in storage.
    - get: (key: K) => V | undefined;
      - Returns the value associated with the given key from storage.
    - has: (key: K) => boolean;
      - Returns true when the storage contains an element with the given key.  False if no such element exists in the storage.
    - delete: (key: K) => boolean;
      - Removes the element associated with the given key from storage.
      - Returns true if the element existed and has been removed or false if the element does not exist.
    - set: (key: K, value: V) => MapStorage<K, V>
      - Adds or updates an element with a specified key and value in storage.
      - Returns the MapStorage object.
  - Constructor:
    - for<T extends [SerializableKey](#SerializableKey), V extends [SerializableValue](#SerializableValue)>(): MapStorage<K, V>
      - Constructs a new MapStorage instance.  Only usable as a [SmartContract](#SmartContract) property.
  - Example:
    ```ts
    class MyToken extends SmartContract {
      private readonly balances = MapStorage.for<Address, Fixed<8>>();

      public transfer(
        from: Address,
        to: Address,
        amount: Fixed<8>,
      ): boolean {
        const fromBalance = this.balances.get(from);
        const toBalance = this.balances.get(to);
        this.balances.set(from, fromBalance - amount);
        this.balances.set(to, toBalance + amount);

        return true
      }
    }
    ```

#### SetStorage
  - Persistent smart contract set storage.
  - Only usable as a [SmartContract](#SmartContract) property.
  - Methods:
    - forEach: (callback: (value: V) => void) => void
      - Executes a provided function once per each value in storage.
    - has: (value: V) => boolean
      - Returns a boolean indicating whether a given value exists in the storage.
    - delete: (value: V) => boolean
      - Removes the specified value from storage.
      - Returns true if the value existed in storage and was removed.
    - add: (value: V) => SetStorage<V>
      - Adds a given value to the storage.
      - Returns the SetStorage object.
  - Constructor:
    - for<V extends [SerializableKey](#SerializableKey))>(): SetStorage<V>
      - Constructs a new SetStorage instance.  Only usable as a [SmartContract](#SmartContract) property.
  - Example:
    ```ts
    class ICO extends SmartContract {
      private readonly whitelistedAddresses = SetStorage.for<Address>();

      public isWhiteListed(address: Address): boolean {
        return this.whitelistedAddresses.has(address);
      }
    }
    ```

#### Blockchain
  - Information about the current state of the blockchain and the current execution.
  - Properties:
    - currentBlockTime: number
      - Time of the current [Block](#Block).
      - During execution, this is the timestamp of the [Block](#Block) that this [Transaction](#Transaction) will be included in.
      - During verification, this is the timestamp of the latest [Block](#Block).
      - currentHeight: number
        - Index of the latest [Block](#Block) persisted to the blockchain.
      - currentTransaction: [InvocationTransaction](#InvocationTransaction)
        - [InvocationTransaction](#InvocationTransaction) this smart contract is executed in.

#### Deploy
  - Inject values at deployment time.
  - Can only be used for default constructor parameters.
  - Properties:
    - senderAddress: [Address](#Address)
      - Use sender [Address](#Address) for the constructor parameter.
  - Example:
    ```ts
    import { Address, Deploy, SmartContract } from '@neo-one/smart-contract'

    class Token extends SmartContract {
      public constructor(public readonly owner: Address = Deploy.senderAddress) {
        super();
      }
    }
    ```

#### ContractProperties
  - Required information for the deployment of a [SmartContract](#SmartContract).
  - Must be included as a public readonly property named `properties` on all [SmartContracts](#SmartContract)
  - Properties:
    - codeVersion: string
    - author: string
    - email: string
    - description: string
  - Example:
    ```ts
    import { SmartContract } from '@neo-one/smart-contract'

    export class MySmartContract extends SmartContract {
      public readonly properties = {
        codeVersion: '1.0',
        author: 'my name',
        email: 'myName@email.io',
        description: 'My Contract',
      };
    ```

#### SmartContract
  - Marks a class as a SmartContract.
  - Smart Contracts written with NEO•ONE are classes which extend this SmartContract base class.
  - Properties:
    - properties: [ContractProperties](#ContractProperties)
      - codeVersion: string
      - author: string
      - email: string
      - description: string
    - address: [Address](#Address)
      - [Address](#Address) of the SmartContract.
    - processedTransactions: [SetStorage<Hash256>](#SetStorage)
      - Stores [Transaction](#Transaction) hashes that have sent or received native assets.
      - Used to enforce that a [Transaction](#Transaction) with native assets is only ever processed appropriately.
    - deployed: true
      - Property primarily used internally to validate that the smart contract is deployed only once.
  - Methods:
    - refundAssets: (transactionHash: Hash256) => boolean
      - Method automatically added for refunding native assets.

#### LinkedSmartContract
  - An object representing a statically linked contract.
  - Constructor:
    - for: <T extends [SmartContract](#SmartContract)> => T | never;
      - Returns an object representing a statically linked contract `T`.
      - `T` is checked for validity and `LinkedSmartContract.for` will report an error during compilation if the interface is invalid.
  - Example:
    ```ts
    import { Token } from './Token';

    const contract = linkedSmartContract.for<Token>();
    const from = Address.from('ALfnhLg7rUyL6Jr98bzzoxz5J7m64fbR4s');
    const to = Address.from('AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx');

    contract.transfer(from, to, 10);
    ```

#### Hashable
  - Hashable types usable by the [Crypto](#Crypto) utilities.
    - number
    - string
    - boolean
    - Buffer

#### Crypto
  - Collection of some common cryptography utilities
    - sha1: ([Hashable](#Hashable)) => Buffer
    - sha256: ([Hashable](#Hashable)) => Buffer
    - hash160: ([Hashable](#Hashable)) => Buffer
    - hash256: ([Hashable](#Hashable)) => Buffer

#### constant
  - Tag to mark a [SmartContract](#SmartContract) method as not modifying storage.
  - Use above a method as `@constant`.
  - Example:
  ```ts
  @constant
  public checkBalance(address: Address): Integer {
    // checks balance, does not alter storage
  }
  ```

