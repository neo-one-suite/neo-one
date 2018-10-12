export class Bar {
  public constructor() {
    //
  }
  public fizz(): string {
    return 'fizz';
  }
}

export const Foo: Bar = new Bar();
