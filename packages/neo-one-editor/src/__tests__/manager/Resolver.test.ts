/* @jest-environment jsdom */
import { FetchQueue, resolve } from '../../manager';

const dependencies = {
  'bignumber.js': '^7.2.1',
  react: '^16.5.1',
  reakit: '0.15.7',
  rxjs: '^6.3.3',
  'react-dom': '^16.5.1',
  'styled-components': '^3.4.10',
};

describe('resolver', () => {
  let fetchQueue: FetchQueue;

  beforeEach(() => {
    fetchQueue = new FetchQueue();
  });

  test('resolve deps', async () => {
    const resolvedDependencies = await resolve(fetchQueue, dependencies);
    expect(resolvedDependencies).toMatchSnapshot();
  });
});
