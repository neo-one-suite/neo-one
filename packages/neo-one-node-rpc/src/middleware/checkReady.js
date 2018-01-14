/* @flow */
import type { Blockchain } from '@neo-one/node-core';

import _ from 'lodash';
import fetch from 'node-fetch';

const fetchCount = async (
  endpoint: string,
  timeoutMS: number,
): Promise<?number> => {
  try {
    // eslint-disable-next-line
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          jsonrpc: '2.0',
          method: 'getblockcount',
          params: [],
          id: 4,
        },
      ]),
      timeout: timeoutMS,
    });
    if (!response.ok) {
      return null;
    }
    // eslint-disable-next-line
    const result = await response.json();
    if (Array.isArray(result)) {
      const responseJSON = result[0];
      if (responseJSON.error || responseJSON.result == null) {
        return null;
      }
      return responseJSON.result;
    }

    return null;
  } catch (error) {
    return null;
  }
};

const fetchTallestBlockIndex = async (
  rpcEndpoints: Array<string>,
  timeoutMS: number,
): Promise<?number> => {
  const counts = await Promise.all(
    rpcEndpoints.map(rpcEndpoint => fetchCount(rpcEndpoint, timeoutMS)),
  );
  return _.max(counts.filter(Boolean).map(count => count - 1));
};

export type Options = {|
  rpcURLs: Array<string>,
  offset: number,
  timeoutMS: number,
|};

export default async ({
  blockchain,
  options,
}: {|
  blockchain: Blockchain,
  options: Options,
|}) => {
  const index = await fetchTallestBlockIndex(
    options.rpcURLs,
    options.timeoutMS,
  );
  const ready =
    options.rpcURLs.length === 0 ||
    (index != null && blockchain.currentBlockIndex >= index - options.offset);

  return { ready, index };
};
