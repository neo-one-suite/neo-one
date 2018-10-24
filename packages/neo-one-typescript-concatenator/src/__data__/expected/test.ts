type childTypeInternal = string | number;
interface ChildInterfaceInternal {
    readonly child: childTypeInternal;
}
type childType = childTypeInternal | ReadonlyArray<childTypeInternal>;
interface ChildInterface {
    readonly child: ChildInterfaceInternal;
}
enum childEnumInternal {
    one,
    two
}
const getEnumValue = (value: number) => childEnumInternal[value];
enum childEnum {
    two,
    three
}
const s9 = 'bar';
function foo() {
    return s9;
}
function barBar() {
    return s9.concat(s9);
}
class ChildClass {
    public readonly prop: string;
    public constructor() {
        this.prop = 'child';
    }
    public childFunc() {
        return foo();
    }
}
export const parentEnum = childEnum;
export type parentType = Buffer | string;
export class ParentTwoClass extends ChildClass {
    public static readonly enumValue = getEnumValue;
    public constructor() {
        super();
    }
    public parentFunc() {
        return this.childFunc();
    }
}
type s26 = childType | Buffer;
const sc1 = new ChildClass();
// tslint:disable-next-line:export-name
export class ParentClass extends ChildClass {
    public readonly thing: s26;
    public readonly child: ChildClass;
    public constructor() {
        super();
        this.thing = '2';
        this.child = sc1;
    }
    public foo() {
        return barBar();
    }
}
