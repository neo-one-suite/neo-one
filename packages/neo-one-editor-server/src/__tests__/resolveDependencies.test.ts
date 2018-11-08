import { resolveDependencies } from '../resolveDependencies';

const dependencies = {
  'bignumber.js': '7.2.1',
  react: '16.5.1',
  reakit: '0.15.7',
  rxjs: '6.3.3',
  'react-dom': '16.5.1',
  'styled-components': '3.4.10',
};

describe('resolveDependencies', () => {
  test('resolve deps', async () => {
    const resolvedDependencies = await resolveDependencies(dependencies);

    expect(resolvedDependencies).toMatchSnapshot();
  });
});
