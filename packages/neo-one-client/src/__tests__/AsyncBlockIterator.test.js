/* @flow */
import { AsyncIterableX as AsyncIterable } from 'ix/asynciterable/asynciterablex';

import _ from 'lodash';
import { toArray } from 'ix/asynciterable/toarray';

import AsyncBlockIterator from '../AsyncBlockIterator';
import { UnknownBlockError } from '../errors';

const blockCount = 10;
const blocks = _.range(blockCount).map(() => ({}));
const filter = {
  indexStop: blockCount,
};
let client = ({}: $FlowFixMe);
let blockIterator = new AsyncBlockIterator({
  client,
  filter,
});
const FETCH_TIMEOUT_MS = 100;
beforeEach(() => {
  client = ({}: $FlowFixMe);
  blockIterator = new AsyncBlockIterator({
    client,
    filter,
    fetchTimeoutMS: FETCH_TIMEOUT_MS,
  });
  // $FlowFixMe
  client.getBlockCount = jest.fn(() => Promise.resolve(blockCount));
  // $FlowFixMe
  client.getBlock = jest.fn(index => Promise.resolve(blocks[index]));
});

const verifyBlockIterator = async () => {
  let index = 0;
  await AsyncIterable.from(blockIterator).forEach(value => {
    expect(value).toBe(blocks[index]);
    index += 1;
  });
  expect(index).toEqual(blockCount);
};

describe('AsyncBlockIterator', () => {
  test('should be an AsyncIterator', () => {
    // $FlowFixMe
    expect(blockIterator[Symbol.asyncIterator]).toBeTruthy();
    // $FlowFixMe
    expect(blockIterator[Symbol.asyncIterator]()).toBeTruthy();
  });

  test('should return blocks in order up until indexStop', async () => {
    await verifyBlockIterator();
  });

  test('should throw an error if the client throws an error', async () => {
    const error = new Error('hello world');
    // $FlowFixMe
    client.getBlockCount = jest.fn(() => Promise.reject(error));
    let thrownError;
    try {
      await toArray(AsyncIterable.from(blockIterator));
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBe(error);
  });

  test('should retry fetch on UnknownBlockError', async () => {
    client.getBlock.mockImplementationOnce(() =>
      Promise.reject(new UnknownBlockError()),
    );
    await verifyBlockIterator();
  });

  test('should throw on other errors', async () => {
    const error = new Error('error');
    client.getBlock.mockImplementationOnce(() => Promise.reject(error));
    let thrownError;
    try {
      await verifyBlockIterator();
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBe(error);
  });
});
