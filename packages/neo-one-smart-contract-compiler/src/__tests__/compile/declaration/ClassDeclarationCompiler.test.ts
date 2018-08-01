import { helpers } from '../../../__data__';

describe('ClassDeclarationCompiler', () => {
  test('basic class with initializer', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with constructor', async () => {
    await helpers.executeString(`
      class Foo {
        x: string;

        constructor() {
          this.x = 'bar';
        }
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with constructor arguments', async () => {
    await helpers.executeString(`
      class Foo {
        x: string;

        constructor(x: string) {
          this.x = x;
        }
      }

      const f = new Foo('bar');
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with default constructor arguments', async () => {
    await helpers.executeString(`
      class Foo {
        x: string;

        constructor(x: string = 'bar') {
          this.x = x;
        }
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with optional constructor arguments', async () => {
    await helpers.executeString(`
      class Foo {
        x: string | undefined;

        constructor(x?: string) {
          this.x = x;
        }
      }

      const f = new Foo();
      if (f.x !== undefined) {
        throw 'Failure';
      }
    `);
  });

  test('basic class with method', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        bar(): string {
          return this.x;
        }
      }

      const f = new Foo();
      if (f.bar() !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with get accessor', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        public get bar(): string {
          return this.x;
        }
      }

      const f = new Foo();
      if (f.bar !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with set accessor', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        public set bar(x: string) {
          this.x = x;
        }
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }

      f.bar = 'baz';
      if ((f.x as string) !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with get/set accessor', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        public get bar(): string {
          return this.x;
        }

        public set bar(x: string) {
          this.x = x;
        }
      }

      const f = new Foo();
      if (f.bar !== 'bar') {
        throw 'Failure';
      }

      f.bar = 'baz';
      if (f.bar !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with inherited property', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';
      }

      class Baz extends Foo {
      }

      const f = new Baz();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with inherited method', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        bar(): string {
          return this.x;
        }
      }

      class Baz extends Foo {
      }

      const f = new Baz();
      if (f.bar() !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with overriden property', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';
      }

      class Baz extends Foo {
        x: string = 'baz';
      }

      const f = new Baz();
      if (f.x !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with overriden method', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        bar(): string {
          return this.x;
        }
      }

      class Baz extends Foo {
        bar(): string {
          return 'baz';
        }
      }

      const f = new Baz();
      if (f.bar() !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with super call', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        public bar(): string {
          return this.x;
        }
      }

      class Baz extends Foo {
        public bar(): string {
          return super.bar() + 'baz';
        }
      }

      const f = new Baz();
      if (f.bar() !== 'barbaz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with super call and void return', async () => {
    await helpers.executeString(`
      class Foo {
        public x: string = 'bar';

        public setQux(): void {
          this.x = 'qux';
        }

        public bar(): string {
          this.setQux();
          return this.x;
        }
      }

      class Baz extends Foo {
        public bar(): string {
          return super.bar() + 'baz';
        }
      }

      const f = new Baz();
      if (true) {
        f.setQux();
        if (f.bar() !== 'quxbaz') {
          throw 'Failure';
        }
      }
    `);
  });

  test('static methods and properties', async () => {
    await helpers.executeString(`
      class Foo {
        private static bInternal: string = 'b';
        public static getA(): string {
          return 'a';
        }

        public static get b(): string {
          return this.bInternal;
        }

        public static set b(value: string) {
          this.bInternal = value;
        }
      }

      class Bar extends Foo {
        public static get c(): string {
          return 'c';
        }
      }

      class Qux extends Bar {
        public static getA(): string {
          return super.getA() + 'c';
        }
      }

      class Baz extends Bar {
        public static getA(): string {
          return super.getA() + super.b + super.c;
        }
      }

      if (Foo.getA() !== 'a') {
        throw 'Failure';
      }

      if (Bar.getA() !== 'a') {
        throw 'Failure';
      }

      if (Bar.c !== 'c') {
        throw 'Failure';
      }

      if (Baz.getA() !== 'abc') {
        throw 'Failure';
      }

      if (Qux.getA() !== 'ac') {
        throw 'Failure';
      }
    `);
  });

  test('decorators', async () => {
    await helpers.compileString(
      `
      function verify(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        throw new Error('This should be transpiled.');
      }

      class Foo {
        @verify
        public bar(): number {
          return 10;
        }
      }
    `,
      { type: 'error' },
    );
  });

  test('realistic class inheritance', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      function verifySender(addr: Buffer): void {
        if (!true) {
          throw new Error('Invalid witness');
        }
      }

      class MapStorage<K extends SerializableValue, V extends SerializableValue> {
        constructor(private readonly prefix?: Buffer) {
        }
        public get(keyIn: K): V | undefined {
          return syscall('Neo.Storage.Get', syscall('Neo.Storage.GetContext'), this.prefix == undefined
            ? syscall('Neo.Runtime.Serialize', keyIn)
            : Buffer.concat([this.prefix, syscall('Neo.Runtime.Serialize', keyIn)])) as (V | undefined);
        }
        public set(keyIn: K, value: V): void {
          syscall('Neo.Storage.Put', syscall('Neo.Storage.GetContext'), this.prefix == undefined
            ? syscall('Neo.Runtime.Serialize', keyIn)
            : Buffer.concat([this.prefix, syscall('Neo.Runtime.Serialize', keyIn)]), value);
        }
      }

      abstract class SmartContract {
        protected get address(): Buffer {
          return syscall('System.ExecutionEngine.GetExecutingScriptHash');
        }
        public deploy(owner: Buffer): boolean {
          this.owner = owner;
          return true;
        }
        public get owner(): Buffer {
          return syscall('Neo.Storage.Get', syscall('Neo.Storage.GetContext'), 'owner') as Buffer;
        }
        public set owner(owner: Buffer) {
          syscall('Neo.Storage.Put', syscall('Neo.Storage.GetContext'), 'owner', owner);
        }
      }

      abstract class Token extends SmartContract {
        private readonly balances: MapStorage<Buffer, number> =
          new MapStorage(syscall('Neo.Runtime.Serialize', 'balances'));

        protected issue(addr: Buffer, amount: number): void {
          this.balances.set(addr, this.balanceOf(addr) + amount);
          this.supply += amount;
        }

        public deploy(owner: Buffer): boolean {
          super.deploy(owner);
          this.supply = 0;
          return true;
        }

        public balanceOf(addr: Buffer): number {
          return this.balances.get(addr) || 0;
        }

        public getSupply(): number {
          return this.supply;
        }

        private get supply(): number {
          return syscall('Neo.Storage.Get', syscall('Neo.Storage.GetContext'), 'supply') as number;
        }
        private set supply(supply: number) {
          syscall('Neo.Storage.Put', syscall('Neo.Storage.GetContext'), 'supply', supply);
        }
      }

      class TestToken extends Token {
        public readonly name: string = 'TestToken';
        public readonly decimals: 4 = 4;
        public readonly symbol: string = 'TT';
        public deploy(owner: Buffer): boolean {
          super.deploy(owner);
          verifySender(owner);
          this.issue(owner, 1000000);
          return true;
        }
      }

      const token = new TestToken();
      if (token.name !== 'TestToken') {
        throw 'Failure';
      }

      if (token.decimals !== 4) {
        throw 'Failure';
      }

      if (token.symbol !== 'TT') {
        throw 'Failure';
      }

      if (!token.deploy(syscall('Neo.Runtime.Serialize', 'owner'))) {
        throw 'Failure';
      }

      if (token.getSupply() !== 1000000) {
        throw 'Failure';
      }
    `);

    await node.executeString(`
      syscall('Neo.Runtime.Call', ${helpers.getUInt160Hash(contract.hash)});
    `);
  });
});
