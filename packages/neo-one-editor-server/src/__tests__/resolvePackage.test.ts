import { resolvePackage } from '../resolvePackage';

describe('resolvePackage', () => {
  test('resolves @types/react', async () => {
    const result = await resolvePackage('@types/react', '16.4.18');

    expect(Object.keys(result)).toMatchSnapshot();
  });

  test('resolves rxjs', async () => {
    const result = await resolvePackage('rxjs', '6.3.3');

    expect(Object.keys(result)).toMatchSnapshot();
  });
});
