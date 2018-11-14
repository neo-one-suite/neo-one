---
id: developer-client-api
title: Developer Client API
---
This is the API documentation for the NEO•ONE Developer Client.  The Developer Client contains helpful methods for use during development on a private network.

## Methods
  - [runConsensusNow](#runConsensusNow)
  - [updateSettings](#updateSettings)
  - [getSettings](#getSettings)
  - [fastForwardOffset](#fastForwardOffset)
  - [fastForwardToTime](#fastForwardToTime)
  - [reset](#reset)

## Methods Reference

<a id="runConsensusNow"></a>
#### runConsensusNow(): Promise\<void\>
  - Runs consensus immediately on your private network.
  - Useful for immediately confirming [Transactions](/docs/en/client-types.html#Transaction) and not having to wait between [Blocks](/docs/en/client-types.html#Block).
  - Example:
    ```ts
    const result = await client.claim();
    // immediately run consensus to create a new block and confirm the clain the the block.
    await Promise.all([
      result.confirmed(),
      developerClient.runConsensusNow(),
    ])
    ```

<a id="updateSettings"></a>
#### updateSettings(Partial<[PrivateNetworkSettings](/docs/en/client-types.html#PrivateNetworkSettings)>): Promise\<void\>
  - Updates the [PrivateNetworkSettings](/docs/en/client-types.html#PrivateNetworkSettings), like seconds per block, to speed up your network for testing.
  - Example:
    ```ts
    const blockCount = await client.read('private').getBlockCount();

    await developerClient.updateSettings({ secondsPerBlock: 1 });
    // wait 5 seconds
    await new Promise<void>((resolve) => setTimeout(resolve, 5000));

    const newBlockCount = await client.read('private').getBlockCount();

    // should output ~ '5' to the console as about 5 blocks will have been process in 5 seconds.
    console.log(newBlockCount - blockCount);
    ```

<a id="getSettings"></a>
#### getSettings(): Promise<[PrivateNetworkSettings](/docs/en/client-types.html#PrivateNetworkSettings)>
  - Returns the current [PrivateNetworkSettings](/docs/en/client-types.html#PrivateNetworkSettings).
  - Example:
    ```ts
    const { secondsPerBlock } = await developerClient.getSettings();
    // print secondsPerBlock to the console.
    console.log(secondsPerBlock);
    ```

<a id="fastForwardOffset"></a>
#### fastForwardOffset(seconds: number): Promise\<void\>
  - Fast forwards the time of a private network by the given number of seconds. The time of the next [Block](/docs/en/client-types.html#Block) will be increased by the offset provided in seconds.
  - This can be useful for testing time dependent contracts, such as ICOs.
  - Example:
    ```ts
    const readClient = client.read('private');

    // get the most recent block's timestamp
    const blockHash = await readClient.getBestBlockHash();
    const block = await readClient.getBlock(blockHash);
    const blockTime = block.time;

    // fast forward the network by 100000000 seconds
    await developerClient.fastForwardOffset(100000000);

    // get the new most recent block's timestamp;
    const newBlockHash = await readClient.getBestBlockHash();
    const newBlock = await readClient.getBlock(newBlockHash);
    const newBlockTime = newBlock.time;

    // This will log 'true' to the console
    console.log((newBlockTime - blockTime) > 100000000);
    ```

<a id="fastForwardToTime"></a>
#### fastForwardToTime(seconds: number): Promise\<void\>
  - Fast forwards the time of a private network to the given number of seconds.  The time of the next [Block](/docs/en/client-types.html#Block) will be set to the time provided in seconds.
  - This can be useful for testing time dependent contracts, such as ICOs.
    - Example:
    ```ts
    const readClient = client.read('private');

    // fast forward the network to 100000000 seconds
    await developerClient.fastForwardOffset(100000000);

    // get the new most recent block's timestamp;
    const blockHash = await readClient.getBestBlockHash();
    const block = await readClient.getBlock(newBlockHash);
    const blockTime = newBlock.time;

    // This will log 'true' to the console. Leaves some buffer in case an extra block has been created.
    console.log(blockTime >= 100000000 && blockTime < 100000030);
    ```

<a id="reset"></a>
#### reset(): Promise\<void\>
  - Resets the private network.
  - Example:
    ```ts
    const readClient = client.read('private');

    const blockCount = await readClient.getBlockCount();
    // Assume the private has been active for some time.
    // This will log a fairly large number to the console.
    console.log(blockCount);

    await developerClient.reset();

    const newBlockCount = await readClient.getBlockCount();
    // This will log '0' or a very small integer to the console.
    console.log(newBlockCount);
    ```
