import { makeErrorWithCode } from '@neo-one/utils';

// tslint:disable-next-line export-name
export const NothingToIssueError = makeErrorWithCode('NOTHING_TO_ISSUE', () => 'Nothing to issue.');
