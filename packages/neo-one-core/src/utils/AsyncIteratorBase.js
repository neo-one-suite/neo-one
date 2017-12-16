export default class AsyncIteratorBase {
  [Symbol.asyncIterator]() {
    return this;
  }
}
