/* @jest-environment jsdom */
import { FetchQueue } from '../../manager';

const url = 'https://cdn.jsdelivr.net/npm/bignumber.js@7.2.1';
const dummyArray = Array.from(Array(100).keys());

describe('fetch queue', () => {
  let fetchQueue: FetchQueue;
  const fetchConcurrency = 3;

  beforeEach(() => {
    fetchQueue = new FetchQueue({ fetchConcurrency });
  });

  test('queues fetches', async () => {
    const mutableRunningArray: number[] = [];
    const queueResults = await Promise.all(
      dummyArray.map(async (idx) => {
        // tslint:disable-next-line:no-any
        mutableRunningArray.push((fetchQueue as any).mutableRunning);

        return fetchQueue.fetch(url, async (_response: Response) => idx);
      }),
    );

    mutableRunningArray.forEach((mutableRunning) => {
      expect(mutableRunning).toBeLessThanOrEqual(fetchConcurrency);
    });
    expect(queueResults).toEqual(dummyArray);
  });
});
