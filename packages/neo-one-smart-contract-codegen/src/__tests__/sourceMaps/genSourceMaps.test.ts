import { genSourceMaps } from '../../sourceMaps';

describe('genSourceMaps', () => {
  test('Token', () => {
    expect(
      genSourceMaps({
        sourceMaps: {},
      }),
    ).toMatchSnapshot();
  });
});
