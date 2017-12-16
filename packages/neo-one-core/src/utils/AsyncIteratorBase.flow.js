/* @flow */
/* eslint-disable */
declare module AsyncIteratorBase {
  declare class AsyncIteratorBase<+Yield, +Return, -Next> extends $AsyncIterator<Yield, Return, Next> {
    @@asyncIterator(): $AsyncIterator<Yield,Return,Next>;
  }

  declare export default typeof AsyncIteratorBase;
}
