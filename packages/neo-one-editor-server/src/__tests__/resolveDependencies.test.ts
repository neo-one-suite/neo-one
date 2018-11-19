import { resolveDependencies } from '../resolveDependencies';

const dependencies = {
  'bignumber.js': '7.2.1',
  react: '16.5.1',
  rxjs: '6.3.3',
  'react-dom': '16.5.1',
  'styled-components': '3.4.10',
};

const dependencyNames = Object.keys(dependencies);

describe('resolveDependencies', () => {
  test('resolve deps', async () => {
    const resolvedDependencies = await resolveDependencies(dependencies);
    // tslint:disable-next-line no-array-mutation
    Object.values(resolvedDependencies)
      .sort((a, b) => (a.name >= b.name ? -1 : 1))
      .forEach((dependency) => {
        if (dependencyNames.includes(dependency.name)) {
          expect(dependency).toMatchSnapshot();
        }
      });
  });
});
