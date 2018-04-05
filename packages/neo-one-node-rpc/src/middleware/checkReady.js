/* @flow */
import type { Blockchain } from '@neo-one/node-core';
import type { Monitor } from '@neo-one/monitor';

import _ from 'lodash';
import fetch from 'node-fetch';

const fetchCount = async (
  monitor: Monitor,
  endpoint: string,
  timeoutMS: number,
): Promise<?number> =>
  monitor
    .withLabels({
      [monitor.labels.HTTP_METHOD]: 'POST',
      [monitor.labels.SPAN_KIND]: 'client',
    })
    .withData({ [monitor.labels.HTTP_URL]: endpoint })
    .captureSpanLog(
      async span => {
        let status = -1;
        let response;
        try {
          response = await fetch(endpoint, {
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
          ({ status } = response);
        } finally {
          span.setLabels({ [monitor.labels.HTTP_STATUS_CODE]: status });
        }
        if (!response.ok) {
          return null;
        }
        const result = await response.json();
        if (Array.isArray(result)) {
          const responseJSON = result[0];
          if (responseJSON.error || responseJSON.result == null) {
            return null;
          }
          return responseJSON.result;
        }

        return null;
      },
      {
        name: 'neo_rpc_check_ready_client_request',
        level: { log: 'debug', span: 'debug' },
        trace: true,
      },
    )
    .catch(() => null);

const CHECK_ENDPOINTS = 5;

const fetchTallestBlockIndex = async (
  monitor: Monitor,
  rpcEndpoints: Array<string>,
  timeoutMS: number,
  checkEndpoints?: number,
): Promise<?number> => {
  const counts = await Promise.all(
    _.take(
      _.shuffle(rpcEndpoints),
      checkEndpoints == null ? CHECK_ENDPOINTS : checkEndpoints,
    ).map(rpcEndpoint => fetchCount(monitor, rpcEndpoint, timeoutMS)),
  );
  return _.max(counts.filter(Boolean).map(count => count - 1));
};

export type Options = {|
  rpcURLs: Array<string>,
  offset: number,
  timeoutMS: number,
  checkEndpoints?: number,
|};

let lastCheckIndex;
let lastCheckTime;

export default async ({
  monitor,
  blockchain,
  options,
}: {|
  monitor: Monitor,
  blockchain: Blockchain,
  options: Options,
|}) => {
  if (
    lastCheckTime == null ||
    monitor.now() - lastCheckTime > options.timeoutMS
  ) {
    lastCheckTime = monitor.now();
    lastCheckIndex = await fetchTallestBlockIndex(
      monitor,
      options.rpcURLs,
      options.timeoutMS,
      options.checkEndpoints,
    );
  }
  const ready =
    options.rpcURLs.length === 0 ||
    lastCheckIndex == null ||
    blockchain.currentBlockIndex >= lastCheckIndex - options.offset;

  return ready;
};
