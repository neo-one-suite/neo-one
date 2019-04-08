import { omit } from 'lodash';
import React from 'react';
import styled, { ThemedStyledFunction } from 'styled-components';

export const numberToPx = (value?: string | number) => {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  if (!value) {
    return `0px`;
  }

  return value;
};

// tslint:disable-next-line
export const callAll = (...fns: Array<Function | undefined>) => (...args: any[]) =>
  // tslint:disable-next-line
  fns.forEach((fn) => fn && fn(...args));

const NO_SELECTOR = 'NO_COMPONENT_SELECTOR';

// tslint:disable-next-line:no-any
function isStyledComponent(comp: any): comp is { readonly styledComponentId: string } {
  return Boolean(comp && typeof comp.styledComponentId === 'string');
}

// tslint:disable-next-line:no-any
function isEmotion(comp: any) {
  return Boolean(comp && comp.__emotion_real);
}

// tslint:disable-next-line:no-any
function isReuse(comp: any): comp is { readonly uses: ReadonlyArray<React.ElementType> } {
  return Boolean(comp && Array.isArray(comp.uses));
}

// tslint:disable-next-line:no-any
function hasSelector(comp: any): comp is { readonly selector: string } {
  return Boolean(comp && typeof comp.selector === 'string');
}

// tslint:disable-next-line:no-any
export function getSelector(comp: string | React.ComponentType<any>): string {
  if (typeof comp === 'string') {
    return `.${comp}`;
  }
  if (isStyledComponent(comp)) {
    return `.${comp.styledComponentId}`;
  }
  if (isEmotion(comp)) {
    return comp.toString();
  }
  if (isReuse(comp)) {
    return comp.uses
      .filter((x) => typeof x !== 'string')
      .map(getSelector)
      .filter((x) => x && x !== NO_SELECTOR)
      .join('');
  }
  if (hasSelector(comp)) {
    return comp.selector;
  }

  return NO_SELECTOR;
}

type Result<P extends object, Q, R, T extends object> = ThemedStyledFunction<
  React.ForwardRefExoticComponent<React.PropsWithoutRef<Q> & React.RefAttributes<R>>,
  P & Q,
  T
>;

// export function styledOmitProps<
//   StyleProps extends object = {},
//   // tslint:disable-next-line:no-any
//   Cmp extends React.ElementType = 'div',
//   // tslint:disable-next-line:no-any
//   RefProps = any,
//   CmpProps = React.ComponentProps<Cmp>
// >(
//   cmp: Cmp,
//   omittedProps: ReadonlyArray<keyof StyleProps>,
//   // tslint:disable-next-line:no-any
//   theme: { [key in string]: any },
// ): Result<StyleProps, CmpProps, RefProps, typeof theme> {
//   const omittedPropsCmp = React.forwardRef<RefProps, CmpProps>((props, ref) => {
//     const filteredProps = omit(props, omittedProps);

//     return React.createElement(cmp, { ...filteredProps, ref });
//   });

//   return styled(omittedPropsCmp);
// }

// tslint:disable-next-line:no-any
export const styledOmitProps = <StyleProps extends object = {}, RefProps = any>(
  component: React.ElementType,
  omittedProps: ReadonlyArray<keyof StyleProps>,
  // tslint:disable-next-line:no-any
  theme: { [key in string]: any } = {},
): Result<StyleProps, React.ComponentProps<typeof component>, RefProps, typeof theme> => {
  const omittedPropsComponent = React.forwardRef<RefProps, React.ComponentProps<typeof component>>((props, ref) => {
    const filteredProps = omit(props, omittedProps);

    return React.createElement(component, { ...filteredProps, ref });
  });

  return styled(omittedPropsComponent);
};
