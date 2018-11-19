import { numberToPx } from '@neo-one/react-core';
import { ifProp, prop, switchProp, withProp } from 'styled-tools';

export type Position = 'top' | 'right' | 'bottom' | 'left';

export interface TransitionProps {
  readonly animated?: boolean;
  readonly fade?: boolean | Position;
  readonly slide?: boolean | Position;
  readonly expand?: boolean | 'center' | Position;
}

export const hasTransition = (props: TransitionProps) =>
  Boolean(props.animated || props.fade || props.slide || props.expand);

export const getTransitionArray = (props: TransitionProps) => [props.animated, props.fade, props.slide, props.expand];

export const excludeTransition = <T extends TransitionProps>(props: T) => {
  const { animated: _animated, fade: _fade, slide: _slide, expand: _expand, ...rest } = props;

  return rest;
};

export const translate3d = (x?: string | number, y?: string | number, z?: string | number) =>
  `translate3d(${numberToPx(x)}, ${numberToPx(y)}, ${numberToPx(z)})`;

export const origin = (x: string | number = 'center', y: string | number = 'center') =>
  `${numberToPx(x)} ${numberToPx(y)}`;

export const calc = (a?: string | number, b?: string | number) => `calc(${numberToPx(a)} + ${numberToPx(b)})`;

export const minus = (v?: string | number) => `-${numberToPx(v)}`;

export interface ExpandProps {
  readonly expand?: boolean | 'center' | Position;
  readonly defaultExpand?: boolean | Position;
}

export const expand = ifProp({ expand: true }, prop('defaultExpand', 'center'), prop('expand'));

export interface SlideProps {
  readonly slide?: boolean | Position;
  readonly defaultSlide?: boolean | Position;
  readonly slideOffset?: number | string;
}

export const slide = ifProp({ slide: true }, prop('defaultSlide', 'right'), prop('slide'));

export const scaleWithProps = ifProp('expand', 'scale(0.01)');

export interface OriginProps {
  readonly originX?: number | string;
  readonly originY?: number | string;
}

const originFunc = (x?: number | string, y?: number | string) =>
  switchProp(
    expand,
    {
      center: origin(calc('50%', x), calc('50%', y)),
      top: origin(calc('50%', x), calc('100%', y)),
      right: origin(x, calc('50%', y)),
      bottom: origin(calc('50%', x), y),
      left: origin(calc('100%', x), calc('50%', y)),
    },
    origin(calc('50%', x), calc('50%', y)),
  );

export const originWithProps = withProp<OriginProps, ReturnType<typeof originFunc>>(['originX', 'originY'], originFunc);

export interface TranslateProps {
  readonly translateX?: number | string;
  readonly translateY?: number | string;
}

export const translateWithProps = withProp<TranslateProps, ReturnType<typeof translate3d>>(
  ['translateX', 'translateY'],
  translate3d,
);

export const slideWithProps = withProp(['translateX', 'translateY', 'slideOffset'], (x, y, offset = '100%') =>
  switchProp(
    slide,
    {
      top: translate3d(x, calc(offset, y)),
      right: translate3d(calc(minus(offset), x), y),
      bottom: translate3d(x, calc(minus(offset), y)),
      left: translate3d(calc(offset, x), y),
    },
    translate3d(x, y),
  ),
);
