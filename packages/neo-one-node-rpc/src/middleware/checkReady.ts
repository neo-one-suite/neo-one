import { Monitor } from '@neo-one/monitor';
import { Blockchain } from '@neo-one/node-core';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import fetch, { Response } from 'node-fetch';

const fetchCount = async (monitor: Monitor, endpoint: string, timeoutMS: number): Promise<number | undefined> =>
  monitor
    .withLabels({
      [monitor.labels.HTTP_METHOD]: 'POST',
      [monitor.labels.SPAN_KIND]: 'client',
    })
    .withData({ [monitor.labels.HTTP_URL]: endpoint })
    .captureSpanLog(
      async (span) => {
        let status = -1;
        let response: Response;
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
          return undefined;
        }
        const result = await response.json();
        if (Array.isArray(result)) {
          const responseJSON = result[0];
          if (responseJSON.error || responseJSON.result === undefined) {
            return undefined;
          }

          return responseJSON.result;
        }

        return undefined;
      },
      {
        name: 'neo_rpc_check_ready_client_request',
        level: { log: 'debug', span: 'debug' },
        trace: true,
      },
    )
    .catch(() => undefined);

const CHECK_ENDPOINTS = 5;

const fetchTallestBlockIndex = async (
  monitor: Monitor,
  rpcEndpoints: ReadonlyArray<string>,
  timeoutMS: number,
  checkEndpoints?: number,
): Promise<number | undefined> => {
  const counts = await Promise.all(
    _.take(_.shuffle(rpcEndpoints), checkEndpoints === undefined ? CHECK_ENDPOINTS : checkEndpoints).map(
      async (rpcEndpoint) => fetchCount(monitor, rpcEndpoint, timeoutMS),
    ),
  );

  return _.max(counts.filter(utils.notNull).map((count) => count - 1));
};
export interface Options {
  readonly rpcURLs: ReadonlyArray<string>;
  readonly offset: number;
  readonly timeoutMS: number;
  readonly checkEndpoints?: number;
}

// tslint:disable no-let
let lastCheckIndex: number | undefined;
let lastCheckTime: number | undefined;
// tslint:enable no-let

export const checkReady = async ({
  monitor,
  blockchain,
  options,
}: {
  readonly monitor: Monitor;
  readonly blockchain: Blockchain;
  readonly options: Options;
}) => {
  if (lastCheckTime === undefined || monitor.now() - lastCheckTime > options.timeoutMS) {
    lastCheckTime = monitor.now();
    lastCheckIndex = await fetchTallestBlockIndex(monitor, options.rpcURLs, options.timeoutMS, options.checkEndpoints);
  }

  return (
    options.rpcURLs.length === 0 ||
    lastCheckIndex === undefined ||
    blockchain.currentBlockIndex >= lastCheckIndex - options.offset
  );
};
