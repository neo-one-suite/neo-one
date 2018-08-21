import { genProjectID } from '../../projectID';

describe('genProjectID', () => {
  test('Token', () => {
    expect(
      genProjectID({
        projectID: 'foobar',
      }),
    ).toMatchSnapshot();
  });
});
