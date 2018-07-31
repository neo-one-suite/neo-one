/* tslint:disable no-string-throw */
import * as bar from './bar';
import baz from './baz';
import { foo } from './foo';
import { Address, foo as foo2, SmartContract } from './foo2';

if (foo !== 'foo') {
  throw 'Failure';
}

if ((foo2 as Address) !== 'foo') {
  throw 'Failure';
}

if (bar.value() !== 0) {
  throw 'Failure';
}

bar.incrementValue();

if (bar.value() !== 1) {
  throw 'Failure';
}

if (bar.x !== 3) {
  throw 'Failure';
}

if (baz !== 'baz') {
  throw 'Failure';
}

class Qux extends SmartContract {}
const qux = new Qux();

if (qux.foo !== 'foo') {
  throw 'Failure';
}
