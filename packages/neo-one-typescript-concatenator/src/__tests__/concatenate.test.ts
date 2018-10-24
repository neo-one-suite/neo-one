import { testDirectoryPath } from '../__data__/helpers';
import { concatenate } from '../concatenate';

const tests: ReadonlyArray<string> = ['test', 'reImport'];

const runConcatenateTest = (entry: string) => {
  test(`${entry} concatenation test`, () => {
    const entryPath = testDirectoryPath(entry);

    const result = concatenate(entryPath);
    if (result === undefined) {
      throw Error('unexpected error, result of concatenation undefined');
    }
    expect(result).toMatchSnapshot();
  });
};

tests.forEach(runConcatenateTest);
