// tslint:disable no-object-mutation
import { from as asyncIterableFrom } from '@reactivex/ix-es2015-cjs/asynciterable';
import { toArray } from '@reactivex/ix-es2015-cjs/asynciterable/toarray';
import _ from 'lodash';
import { AsyncBlockIterator } from '../AsyncBlockIterator';
import { UnknownBlockError } from '../errors';

const blockCount = 10;
const blocks = _.range(blockCount).map(() => ({}));
const options = {
  indexStart: 0,
  indexStop: blockCount,
};

const FETCH_TIMEOUT_MS = 100;

describe('AsyncBlockIterator', () => {
  let client: {
    getBlockCount: jest.Mock;
    getBlock: jest.Mock;
  };
  let blockIterator: AsyncBlockIterator;

  const verifyBlockIterator = async () => {
    let index = 0;
    await asyncIterableFrom(blockIterator).forEach((value) => {
      expect(value).toBe(blocks[index]);
      index += 1;
    });
    expect(index).toEqual(blockCount);
  };

  beforeEach(() => {
    client = {
      getBlockCount: jest.fn(async () => Promise.resolve(blockCount)),
      getBlock: jest.fn(async (index) => Promise.resolve(blocks[index])),
    };
    blockIterator = new AsyncBlockIterator({
      // tslint:disable-next-line no-any
      client: client as any,
      options,
      fetchTimeoutMS: FETCH_TIMEOUT_MS,
    });
  });

  test('should be an AsyncIterator', () => {
    expect(blockIterator[Symbol.asyncIterator]).toBeTruthy();
    expect(blockIterator[Symbol.asyncIterator]()).toBeTruthy();
  });

  test('should return blocks in order up until indexStop', async () => {
    await verifyBlockIterator();
  });

  test('should throw an error if the client throws an error', async () => {
    const error = new Error('hello world');

    client.getBlockCount = jest.fn(async () => Promise.reject(error));
    let thrownError;
    try {
      await toArray(asyncIterableFrom(blockIterator));
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBe(error);
  });

  test('should retry fetch on UnknownBlockError', async () => {
    client.getBlock.mockImplementationOnce(async () => Promise.reject(new UnknownBlockError()));

    await verifyBlockIterator();
  });

  test('should throw on other errors', async () => {
    const error = new Error('error');
    client.getBlock.mockImplementationOnce(async () => Promise.reject(error));
    let thrownError;
    try {
      await verifyBlockIterator();
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBe(error);
  });
});
