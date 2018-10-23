/* @jest-environment jsdom */
import { FetchQueue, Resolver } from '../../manager';

const dependencies = {
  'bignumber.js': '^7.2.1',
  react: '^16.5.1',
  reakit: '0.15.7',
  rxjs: '^6.3.3',
  'react-dom': '^16.5.1',
  'styled-components': '^3.4.10',
};

describe('resolver', () => {
  let fetchQueue: FetchQueue<string>;

  beforeEach(() => {
    fetchQueue = new FetchQueue<string>();
  });

  test('resolve deps', async () => {
    const resolver = new Resolver({ fetchQueue });

    const resolvedDependencies = await resolver.resolve(dependencies);
    expect(resolvedDependencies).toMatchSnapshot();
  });
});
