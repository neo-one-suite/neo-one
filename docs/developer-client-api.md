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

<a id="updateSettings"></a>
#### updateSettings(Partial<[PrivateNetworkSettings](/docs/en/client-types.html#PrivateNetworkSettings)>): Promise\<void\>
  - Updates the [PrivateNetworkSettings](/docs/en/client-types.html#PrivateNetworkSettings), like seconds per block, to speed up your network for testing.

<a id="getSettings"></a>
#### getSettings(): Promise<[PrivateNetworkSettings](/docs/en/client-types.html#PrivateNetworkSettings)>
  - Returns the current [PrivateNetworkSettings](/docs/en/client-types.html#PrivateNetworkSettings).

<a id="fastForwardOffset"></a>
#### fastForwardOffset(seconds: number): Promise\<void\>
  - Fast forwards the time of a private network by the given number of seconds. The time of the next [Block](/docs/en/client-types.html#Block) will be increased by the offset provided in seconds.
  - This can be useful for testing time dependent contracts, such as ICOs.

<a id="fastForwardToTime"></a>
#### fastForwardToTime(seconds: number): Promise\<void\>
  - Fast forwards the time of a private network to the given number of seconds.  The time of the next [Block](/docs/en/client-types.html#Block) will be set to the time provided in seconds.
  - This can be useful for testing time dependent contracts, such as ICOs.

<a id="reset"></a>
#### reset(): Promise\<void\>
  - Resets the private network.
