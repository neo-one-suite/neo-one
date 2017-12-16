/* @flow */
import { JSONRPCBasicClientProvider } from '../../json';

describe('JSONRPCBasicClientProvider', () => {
  test('constructor', () => {
    const jsonProvider = ({}: $FlowFixMe);

    const provider = new JSONRPCBasicClientProvider(jsonProvider);

    expect(provider).toBeTruthy();
  });
});
