// tslint:disable no-any
import * as React from 'react';

export interface Dictionary<T = any> {
  readonly [key: string]: T;
}

/**
 * @template T Object
 * @template K Union of T keys
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * @template T Object
 * @template K Union of keys (not necessarily present in T)
 */
export type Without<T, K> = Pick<T, Exclude<keyof T, K>>;

/**
 * Transform `"a" | "b"` into `"a" & "b"`
 * @template U Union
 */
// tslint:disable-next-line:no-unused
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
  ? I
  : never;

/**
 * Use prop
 * @template P Props type
 */
export type UseProp<P = any> = keyof JSX.IntrinsicElements | React.ComponentType<P>;

/**
 * Remove use props from object `T` if they're present
 * @template T Object
 */
export type WithoutUseProps<T> = Without<T, 'use' | 'useNext'>;

/**
 * Grab components passed to the `use` prop and return their props
 * @template T Component type
 */
export type InheritedProps<T extends keyof JSX.IntrinsicElements | React.ComponentType<any>> = WithoutUseProps<
  UnionToIntersection<React.ComponentPropsWithRef<T>>
>;

/**
 * Props of a component created with `use()`
 * @template T The type of the `use` prop
 */
export type UseProps<T extends keyof JSX.IntrinsicElements | React.ComponentType<any>> = InheritedProps<T> & {
  readonly use?: T | readonly T[];
  readonly useNext?: T | readonly T[];
};

/**
 * Component created with `use()`
 * @template T Component type passed to `use(...components)`
 */
export interface UseComponent<T extends keyof JSX.IntrinsicElements | React.ComponentType<any>> {
  <TT extends keyof JSX.IntrinsicElements | React.ComponentType<any>>(
    props: InheritedProps<T> & UseProps<TT>,
  ): JSX.Element;
  readonly uses: readonly T[];
  readonly propTypes?: any;
  readonly defaultProps?: any;
  readonly displayName?: string;
}

// tslint:disable-next-line readonly-array
function omit<P extends Dictionary, K extends keyof P>(object: P, ...paths: K[]): Omit<P, K> {
  const keys = Object.keys(object);
  const result: Partial<Omit<P, K>> = {};

  // tslint:disable-next-line:no-loop-statement
  for (const key of keys) {
    // tslint:disable-next-line:no-any
    if (paths.indexOf(key as any) === -1) {
      // tslint:disable-next-line:no-object-mutation
      (result as any)[key] = object[key];
    }
  }

  // tslint:disable-next-line:no-any
  return result as any;
}

function toArray<T>(arg?: T | readonly T[]): readonly T[] {
  if (typeof arg === 'undefined') {
    return [];
  }

  return Array.isArray(arg) ? arg : [arg];
}

function arrayContainsArray(superset: readonly any[], subset: readonly any[]) {
  if (superset.length < subset.length) {
    return false;
  }

  // tslint:disable-next-line:no-loop-statement
  for (const value of subset) {
    if (superset.indexOf(value) === -1) {
      return false;
    }
  }

  return true;
}

const Use = React.forwardRef((props: UseProps<any>, ref) =>
  render(Object.assign(omit(props, 'useNext'), { ref, use: props.useNext })),
);

function render(props: UseProps<any>) {
  // filter Use and string components in the middle
  const [Component, ...useNext] = toArray(props.use).filter(
    (x, i, arr) => x !== Use && (typeof x !== 'string' || i === arr.length - 1),
  );

  if (!Component) {
    // tslint:disable-next-line:no-null-keyword
    return null;
  }

  const finalProps = omit(props, 'use', 'useNext');

  if (!useNext.length || typeof Component === 'string') {
    return <Component {...finalProps} />;
  }

  if (useNext.length === 1) {
    return <Component {...finalProps} use={useNext[0]} />;
  }

  return <Component {...props} use={Use} useNext={useNext} />;
}

function isUseComponent<T extends UseProp[]>(component?: any): component is UseComponent<T[number]> {
  return component && Array.isArray(component.uses);
}

export function use<T extends UseProp[]>(...uses: T): UseComponent<T[number]> {
  const [First, ...next] = uses;

  if (isUseComponent(First) && arrayContainsArray(First.uses, next)) {
    return First;
  }

  const Component = React.forwardRef((props: any, ref) =>
    render(
      Object.assign(omit(props, 'useNext'), {
        ref,
        use: [...uses, ...toArray(props.use), ...toArray(props.useNext)],
      }),
    ),
  );

  // tslint:disable-next-line:no-object-mutation
  (Component as any).uses = uses;

  return Component as any;
}
