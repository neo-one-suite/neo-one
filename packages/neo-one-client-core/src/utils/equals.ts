export function equals<T>(
  // tslint:disable-next-line no-any readonly-array
  clazz: { new (...args: any[]): T },
  equalsFunc: (other: T) => boolean,
  // tslint:disable-next-line no-any
): (other: any) => boolean {
  return (other): boolean =>
    other != undefined &&
    // @ts-ignore
    (this === other || (other instanceof clazz && equalsFunc(other)));
}
