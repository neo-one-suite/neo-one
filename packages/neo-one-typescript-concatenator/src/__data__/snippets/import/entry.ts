/* tslint:disable no-string-throw */
import * as bar from './bar';
import baz from './baz';
import { foo } from './foo';
import { Address, foo as foo2, Foo2SmartContract, SmartContract } from './foo2';
import incrementValue, { value } from './qux';
import { FooType } from './type';

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

if (value() !== 0) {
  throw 'Failure';
}

incrementValue();

if (value() !== 1) {
  throw 'Failure';
}

if (bar.x !== 3) {
  throw 'Failure';
}

if (baz !== 'baz') {
  throw 'Failure';
}

// tslint:disable-next-line export-name
export class Qux extends SmartContract {
  public useFooType(fooType: FooType): string {
    return fooType.bar;
  }
}
const qux = new Qux();

if (qux.foo !== 'foo') {
  throw 'Failure';
}

const fooSC = new Foo2SmartContract();

if (fooSC.foo !== 'foo') {
  throw 'Failure';
}

// Simple export
export { fooSC };
// Rename simple export
export { fooSC as barSC };
// Export namespace import
export { bar };
// Rename export namespace import
export { bar as bar2 };
// Export default import
export { baz };
// Rename export default import
export { baz as baz2 };
// Export all, 1 level
export * from './type';
// Export all, 2 levels
export * from './foo3';
// Export all, 2 levels with rename
export * from './foo4';
// Export one of a multi-decl statement
export { fizz } from './varDecl';
// Namespace export
export * as foo5 from './foo5';
export * as somethingElse from './foo5';
