/* @flow */
import type { Blockchain } from '@neo-one/node-core';
import type { Context } from 'koa';

import _ from 'lodash';
import fetch from 'node-fetch';
import mount from 'koa-mount';

import { getLog, simpleMiddleware } from './common';

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
  rpcEndpoints: Array<string>,
  offset: number,
  timeoutMS: number,
|};

export default ({
  blockchain,
  options,
}: {|
  blockchain: Blockchain,
  options: Options,
|}) =>
  simpleMiddleware(
    'readyHealthCheck',
    mount('/ready_health_check', async (ctx: Context) => {
      const log = getLog(ctx);
      const index = await fetchTallestBlockIndex(
        options.rpcEndpoints,
        options.timeoutMS,
      );
      if (
        index != null &&
        blockchain.currentBlockIndex >= index - options.offset
      ) {
        ctx.status = 200;
      } else {
        log({
          event: 'READY_HEALTH_CHECK_ERROR',
          index,
          currentBlockIndex: blockchain.currentBlockIndex,
        });
        ctx.status = 500;
      }
    }),
  );
