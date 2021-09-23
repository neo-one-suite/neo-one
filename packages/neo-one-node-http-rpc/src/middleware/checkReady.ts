import { Logger } from '@neo-one/logger';
import { Blockchain } from '@neo-one/node-core';
import { Labels, utils } from '@neo-one/utils';
import fetch from 'cross-fetch';
import _ from 'lodash';

const fetchCount = async (logger: Logger, endpoint: string, timeoutMS: number): Promise<number | undefined> => {
  let logLabels: object = {
    name: 'neo_rpc_check_ready_client_request',
    [Labels.HTTP_METHOD]: 'POST',
    [Labels.SPAN_KIND]: 'client',
    [Labels.HTTP_URL]: endpoint,
  };
  const logResult = () => logger.trace(logLabels);

  try {
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
        // @ts-ignore
        timeout: timeoutMS,
      });

      ({ status } = response);
    } finally {
      logLabels = {
        [Labels.HTTP_STATUS_CODE]: status,
        ...logLabels,
      };
    }
    if (!response.ok) {
      logResult();

      return undefined;
    }
    const result = await response.json();
    if (Array.isArray(result)) {
      const responseJSON = result[0];
      if (responseJSON.error || responseJSON.result === undefined) {
        logResult();

        return undefined;
      }
      logResult();

      return responseJSON.result;
    }

    return undefined;
  } catch (err) {
    logger.error({ ...logLabels, err });

    return undefined;
  }
};

const CHECK_ENDPOINTS = 5;

const fetchTallestBlockIndex = async (
  logger: Logger,
  rpcEndpoints: readonly string[],
  timeoutMS: number,
  checkEndpoints?: number,
): Promise<number | undefined> => {
  const counts = await Promise.all(
    _.take(_.shuffle(rpcEndpoints), checkEndpoints === undefined ? CHECK_ENDPOINTS : checkEndpoints).map(
      async (rpcEndpoint) => fetchCount(logger, rpcEndpoint, timeoutMS),
    ),
  );

  return _.max(counts.filter(utils.notNull).map((count) => count - 1));
};
export interface Options {
  readonly rpcURLs?: readonly string[];
  readonly offset?: number;
  readonly timeoutMS?: number;
  readonly checkEndpoints?: number;
}

// tslint:disable no-let
let lastCheckIndex: number | undefined;
let lastCheckTime: number | undefined;
// tslint:enable no-let

interface CheckReadyOptions {
  readonly logger: Logger;
  readonly blockchain: Blockchain;
  readonly options: Options;
}

export const checkReady = async ({
  logger,
  blockchain,
  options: { rpcURLs = [], offset = 3, timeoutMS = 1000, checkEndpoints },
}: CheckReadyOptions) => {
  if (lastCheckTime === undefined || Date.now() - lastCheckTime > timeoutMS) {
    lastCheckTime = Date.now();
    lastCheckIndex = await fetchTallestBlockIndex(logger, rpcURLs, timeoutMS, checkEndpoints);
  }

  return (
    rpcURLs.length === 0 || lastCheckIndex === undefined || blockchain.currentBlockIndex >= lastCheckIndex - offset
  );
};
