import { barBar, ChildClass } from './childOne';
import { childType } from './childTwo';

type parentType = childType | Buffer;

const bar = new ChildClass();

// tslint:disable-next-line:export-name
export class ParentClass extends ChildClass {
  public readonly thing: parentType;
  public readonly child: ChildClass;

  public constructor() {
    super();
    this.thing = '2';
    this.child = bar;
  }

  public foo() {
    return barBar();
  }
}
