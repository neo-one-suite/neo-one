/* @flow */

export default class AsyncIteratorBase {
  // $FlowFixMe
  [Symbol.asyncIterator]() {
    return this;
  }
}
