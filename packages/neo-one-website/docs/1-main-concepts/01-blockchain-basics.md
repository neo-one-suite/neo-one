---
slug: blockchain-basics
title: Blockchain Basics
---
# Blockchain Basics

Blockchain can be a complex concept, but this chapter should help distill down the most important parts for becoming an effective dapp developer.

We'll take a look at some of the foundational technologies of blockchain and learn how they each contribute to the larger picture. If you feel like you already have a strong grasp of blockchain fundamentals and just want to learn about NEO blockchain specifics, feel free to skip to the NEO Specifics section.

[[toc]]

## Peer to Peer Network

Blockchain is a large peer to peer network, which means that there is no centralized server or authority. We typically refer to a peer in a blockchain network as a **node**. Each node is equal, though in some blockchains certain nodes have more responsibilities than others by taking on a specific role within the network ecosystem, such as that of a block producing node (sometimes caller a miner). Some nodes are referred to as a "full node" which means they hold a copy of the entire blockchain on a single device. This adds resiliency to the network, as long as a single full node exists with a full copy of the blockchain, the network can be rebuilt. This is one of the key advantages to blockchain compared to traditional client-server models; there is no central point of failure, making it far less vulnerable to being exploited or lost. There is no central or dominant authority and no single party can control the network for their own gain. Blockchain networks are therefore both *distributed* and *decentralized*.

## Cryptography

Blockchain uses cryptography to maintain network integrity. Once something is recorded on the blockchain, anyone can verify that it was done so legitimately and in a manner that preserves security. In particular, blockchain employs [public-key cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography) to secure communication on the network. Public-key cryptography enables users to digitally sign a message with a "private key", typically represented as a string of random characters, and then anyone can verify that they signed the message using the associated "public key" for that private key. The public key is generated directly from the private key in a way that cannot be reversed while still enabling the ability to verify that a given digital signature was produced by a particular (unknown) private key. Through public-key cryptography, blockchain is capable of ensuring that any data being recorded onto it has not been tampered with.

::: warning

Note

The public key is typically referred to as the "address" of a user. In some blockchains, NEO being one of them, a public key is further encoded to produce a valid address.

:::

## Hashing

A hash function takes an input of any length and uses a mathematical algorithm to produce a fixed output. Cryptographic hashing takes this one step further by making the hash cryptographically secure, that is, it's impossible to determine the input based on the hash value. In summary, a cryptographic hash function has several qualities:

  1. Impossible to produce the same hash value from different inputs.
  2. The same input will always produce the same hash value.
  3. Computationally inexpensive to produce a hash value.
  4. Impossible to determine the input based on the hash value.

Another way to think about hashing is that it produces a unique digital fingerprint of the input. In blockchain, we see hashes everywhere. Transaction hashes are produced by hashing the contents of the transaction and are often referred to as the transaction id or TXID. Block hashes are produced by hashing the contents of the block.

## Blockchain Data Structure

Blockchain at it's core is just a data structure. It's a linked list of blocks where the the links are direct references to the previous block's hash. Since the previous block's hash is part of the content of the block, it makes it difficult to tamper with the blockchain. For example, changing the 10th block in the blockchain would change the hash of not only that block, but every block afterwards, making changes easy to detect.

In addition to the hash of the previous block, block's contain:

  1. Roof ot the transaction hash tree (Merkle Tree).
  2. Timestamp at which the block was produced.
  3. Index of the block within the blockchain
  4. Transactions (though they are not included in the hash, instead the root of Merkle Tree, 1/ is included)

::: warning

Note

You might be wondering why a [Merkle Tree](https://en.wikipedia.org/wiki/Merkle_tree) is used rather than just hashing the list of transactions. In short, a Merkle Tree is an efficient way to not only produce the hash of a given set of hashes, but also to verify that a particular hash exists within the set.

:::

Transactions are simply a store of data. In Bitcoin, for example, they comprise of a data structure of inputs and outputs that represent financial transactions. This system is called unspent transaction outputs, or UTXO, for short. NEO adopts this system for its native assets, NEO and GAS.

In NEO as well as other smart contract platforms like Ethereum, the transaction also contains the script to run on the platform's virtual machine.

## Consensus

Consensus is the mechanism by which the peer-to-peer networks comes to agreement on the next block to add to the blockchain. There are two main consensus algorithms, Proof of Work (PoW) and Proof of Stake, from which many variations are produced. Proof of work requires miner nodes to solve cryptographic puzzles in order to earn the right to add blocks to the chain. Proof of stake requires block producing nodes to stake value (currency) in order to earn the right to add blocks to the chain. In both cases, nodes are incentivized to act honestly, i.e. not produce blocks that have been tampered with or break the rules of the blockchain. The key insight is that acting dishonestly is both easily detectable by other nodes on the network and that by having a block rejected there is an economic penalty. In PoW the economic penalty comes in the form of cost to produce the block - that is, the pure resource cost (energy, price of equipment) required to solve the cryptographic puzzles. In proof of stake the economic penalty results from a punishment for acting dishonestly, that is, a portion of the staked currency is taken by the network.

Delegated Proof of Stake works in a similar way to Proof of Stake, however instead of block producing nodes staking to earn the right to produce blocks, the users of the network vote on nodes with weight proportional to their holdings. In this system, nodes are incentivized to act honestly because otherwise they will be voted out. Voters are incentivized to vote for nodes that will act honestly because the integrity of the network is at stake, and thus the value of their holdings.

## NEO Specifics

NEO's blockchain datastructure is very similar to other blockchains and the general outline we gave above. Like Bitcoin, NEO uses the UTXO model for its native assets, NEO and GAS. Like Ethereum, NEO also is a full smart contract platform with its own virtual machine.

One differentiating factor to be aware of is that NEO currently has several different types of transactions that can be included in a block; we'll list the most important ones below:

  1. `ContractTransaction` - Used for transferring native assets. May only contain inputs and outputs.
  2. `InvocationTransaction` - Used for invoking smart contracts. May contain inputs and outputs.
  3. `ClaimTransaction` - Used for claiming accrued GAS

Take a look at the [@neo-one/client](/docs/client) reference for more details on the specific properties stored on each transaction type. Note the final transaction in that list, the `ClaimTransaction`, refers to claiming GAS. GAS is produced every block and allocated to every NEO holder in proportion to their holdings. NEO holders claim their GAS by submitting a `ClaimTransaction` to the network. GAS is used to "fuel" the network; it's used primarily for transaction fees and is also meant as the primary currency. NEO, on the other hand, is meant to represent ownership of the network and is used only for voting and generating GAS.

NEO uses a form of Delegated Proof of Stake called Delegated Byzantine Fault Tolerance (dBFT). While we won't go into detail on the algorithm, the key differentiator of dBFT is that it results in one block finality. That is, once a block has been propagated on the network, it cannot be reversed. Contrast this with most blockchain consensus algorithms which can have anywhere from 6 blocks to 40 or more block finality. NEO holders vote in consensus nodes which participate in producing new blocks via dBFT.
