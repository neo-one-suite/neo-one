/* @flow */
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';

import { filter, map } from 'ix/asynciterable/pipe/index';

import type {
  ABI,
  BlockFilter,
  Event,
  Log,
  ReadSmartContract,
  StorageItem,
} from '../types'; // eslint-disable-line
import type ReadClient from '../ReadClient';

import * as common from './common';

export default ({
  abi,
  client,
}: {|
  abi: ABI,
  client: ReadClient<*>,
|}): ReadSmartContract => {
  const events = (abi.events || []).reduce((acc, event) => {
    acc[event.name] = event;
    return acc;
  }, {});

  const iterActions = (filterIn?: BlockFilter): AsyncIterable<Event | Log> => {
    const blockFilter = filterIn || {};
    return AsyncIterableX.from(client._iterActions(blockFilter)).pipe(
      filter(action => action.scriptHash === abi.hash),
      map(action => common.convertAction({ action, events })),
    );
  };

  const iterEvents = (actionFilter?: BlockFilter): AsyncIterable<Event> =>
    AsyncIterableX.from(iterActions(actionFilter)).pipe(
      map(action => {
        if (action.type === 'Log') {
          return (null: $FlowFixMe);
        }

        return action;
      }),
      filter(Boolean),
    );

  const iterLogs = (actionFilter?: BlockFilter): AsyncIterable<Log> =>
    AsyncIterableX.from(iterActions(actionFilter)).pipe(
      map(action => {
        if (action.type === 'Event') {
          return (null: $FlowFixMe);
        }

        return action;
      }),
      filter(Boolean),
    );

  const iterStorage = (): AsyncIterable<StorageItem> =>
    client._iterStorage(abi.hash);

  return { iterActions, iterEvents, iterLogs, iterStorage };
};
