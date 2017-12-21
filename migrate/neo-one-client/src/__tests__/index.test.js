/* @flow */
import client, { BasicClient, Client, testClient } from '../index';

test('exports', () => {
  expect(client).toMatchSnapshot();
  expect(testClient).toMatchSnapshot();
  expect(Client).toBeTruthy();
  expect(BasicClient).toBeTruthy();
});
