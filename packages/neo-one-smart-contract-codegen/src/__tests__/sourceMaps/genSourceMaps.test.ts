import { genSourceMaps } from '../../sourceMaps';

describe('genSourceMaps', () => {
  test('Token', () => {
    expect(
      genSourceMaps({
        sourceMapsPath: '/foo/sourceMaps.js',
        sourceMaps: {},
      }),
    ).toMatchSnapshot();
  });
});
