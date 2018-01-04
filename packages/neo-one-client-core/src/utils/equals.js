/* @flow */
export default function<T>(
  clazz: Class<T>,
  equals: (other: T) => boolean,
): (other: mixed) => boolean {
  return (other: mixed): boolean =>
    other != null &&
    (this === other || (other instanceof clazz && equals(other)));
}
