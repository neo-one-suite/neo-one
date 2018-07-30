export function equals<T>(
  // tslint:disable-next-line no-any readonly-array
  clazz: { new (...args: any[]): T },
  thiz: T,
  equalsFunc: (other: T) => boolean,
  // tslint:disable-next-line no-any
): (other: any) => boolean {
  return (other): boolean => other != undefined && (thiz === other || (other instanceof clazz && equalsFunc(other)));
}
