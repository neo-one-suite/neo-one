import { genSourceMaps } from '../../sourceMaps';

describe('genSourceMaps', () => {
  test('Token', () => {
    expect(
      genSourceMaps({
        httpServerPort: 40011,
        projectIDPath: '/foo/bar/one/generated/projectID.js',
        sourceMapsPath: '/foo/bar/one/generated/sourceMaps.js',
        sourceMaps: {},
      }),
    ).toMatchSnapshot();
  });
});
