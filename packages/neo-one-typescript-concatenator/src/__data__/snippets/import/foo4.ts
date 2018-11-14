import FooSmartContract, { Address, foo } from './foo';

export { SmartContract as SmartContract2Level } from './foo';
export { FooSmartContract as FooSmartContract2Level, foo as foo2level, Address as Address2Level };
