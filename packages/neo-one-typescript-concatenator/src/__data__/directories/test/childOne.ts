const bar = 'bar';

function foo() {
  return bar;
}

export function barBar() {
  return bar.concat(bar);
}

export class ChildClass {
  public readonly prop: string;
  public constructor() {
    this.prop = 'child';
  }

  public childFunc() {
    return foo();
  }
}
