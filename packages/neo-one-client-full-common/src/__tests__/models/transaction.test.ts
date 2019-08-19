import { IssueTransactionModel } from '../../models/transaction';

describe('Issue Transaction Model', () => {
  test('Construction fails on bad version', () => {
    const badVersion = 2;

    expect(
      () =>
        new IssueTransactionModel({
          version: badVersion,
        }),
    ).toThrowError(`Expected version to be 1, found: ${badVersion}`);
  });
});
