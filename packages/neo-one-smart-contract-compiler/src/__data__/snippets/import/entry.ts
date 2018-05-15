/* tslint:disable no-string-throw */
import { foo } from './foo';
import { SmartContract, Address, foo as foo2 } from './foo2';
import * as bar from './bar';
import baz from './baz';

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
