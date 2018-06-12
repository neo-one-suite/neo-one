export function equals<T>(
  clazz: { new (...args: any[]): T },
  equalsFunc: (other: T) => boolean,
): (other: any) => boolean {
  return (other: any): boolean =>
    // @ts-ignore
    other != null &&
    (this === other || (other instanceof clazz && equalsFunc(other)));
}
