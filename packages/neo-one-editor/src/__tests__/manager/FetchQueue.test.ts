/* @jest-environment jsdom */
import { FetchQueue } from '../../manager';

const url = 'https://cdn.jsdelivr.net/npm/bignumber.js@7.2.1';
const dummyArray = Array.from(Array(100).keys());

describe('fetch queue', () => {
  let fetchQueue: FetchQueue<number>;
  const fetchConcurrency = 3;

  beforeEach(() => {
    fetchQueue = new FetchQueue<number>({ fetchConcurrency });
  });

  test('queues fetches', async () => {
    const mutableRunningSpy = jest.spyOn(fetchQueue, 'testSpy');
    const queuePromises = dummyArray.map(
      async (idx) =>
        // tslint:disable-next-line:promise-must-complete
        new Promise<number>((resolve, reject) => {
          fetchQueue.push({
            url,
            handleResponse: async (_response: Response) => idx,
            resolve,
            reject,
          });
        }),
    );
    fetchQueue.advance();
    fetchQueue.advance();
    fetchQueue.advance();
    fetchQueue.advance();

    const queueResults = await Promise.all(queuePromises);

    mutableRunningSpy.mock.calls.forEach(([mutableRunning]) => {
      expect(mutableRunning).toBeLessThanOrEqual(fetchConcurrency);
    });
    expect(queueResults).toEqual(dummyArray);
  });
});
