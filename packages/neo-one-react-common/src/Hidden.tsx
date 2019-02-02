// tslint:disable no-null-keyword no-object-mutation
import { Box, callAll } from '@neo-one/react-core';
import * as React from 'react';
import styled, { css } from 'styled-components';
import { ifProp, prop, theme } from 'styled-tools';
import {
  excludeTransition,
  ExpandProps,
  getTransitionArray,
  hasTransition,
  OriginProps,
  originWithProps,
  scaleWithProps,
  SlideProps,
  slideWithProps,
  TransitionProps,
  TranslateProps,
  translateWithProps,
} from './transition';

const { forwardRef, useCallback, useEffect, useRef, useState } = React;

export interface UseHiddenProps {
  readonly visible: boolean;
  readonly show: () => void;
  readonly hide: () => void;
  readonly toggle: () => void;
}

export const useHidden = (propVisible = false): [boolean, () => void, () => void, () => void] => {
  const [visible, setVisible] = useState(propVisible);
  const show = useCallback(() => setVisible(true), [setVisible]);
  const hide = useCallback(() => setVisible(false), [setVisible]);
  const toggle = useCallback(() => setVisible(!visible), [setVisible, visible]);

  return [visible, show, hide, toggle];
};

export interface HiddenProps extends TransitionProps, OriginProps, TranslateProps, ExpandProps, SlideProps {
  readonly visible?: boolean;
  readonly transitioning?: boolean;
  readonly unmount?: boolean;
  readonly hide?: () => void;
  readonly hideOnEsc?: boolean;
  readonly hideOnClickOutside?: boolean;
}

const HiddenComponent = forwardRef<HTMLDivElement, HiddenProps & React.ComponentPropsWithRef<typeof Box>>(
  (
    {
      visible: propVisible = false,
      transitioning: propTransitioning = false,
      unmount = false,
      hideOnEsc = false,
      hideOnClickOutside = false,
      hide,
      ...props
    },
    refIn,
  ) => {
    const myRef = useRef<HTMLDivElement>(null);
    const ref = refIn === null ? myRef : (refIn as React.RefObject<HTMLDivElement>);
    const [visible, setVisible] = useState(!!propVisible);
    const [transitioning, setTransitioning] = useState(!!propTransitioning);
    const refVisible = useRef(visible);
    refVisible.current = visible;

    const handleTransitionEnd = useCallback(() => {
      if (unmount && !propVisible) {
        setTransitioning(false);
      }
    }, [unmount, propVisible]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && propVisible && hide) {
          hide();
        }
      };

      const handleClickOutside = (e: MouseEvent) => {
        const node = ref.current;

        // tslint:disable-next-line no-any
        if (node !== null && !node.contains(e.target as any) && propVisible && hide !== undefined) {
          setTimeout(() => {
            if (refVisible.current) {
              hide();
            }
          });
        }
      };

      if (hideOnEsc) {
        document.body.addEventListener('keydown', handleKeyDown);
      }

      if (hideOnClickOutside) {
        document.body.addEventListener('click', handleClickOutside);
      }

      return () => {
        document.body.removeEventListener('keydown', handleKeyDown);
        document.body.removeEventListener('click', handleClickOutside);
      };
    }, [propVisible, hide, ref, refVisible, hideOnEsc, hideOnClickOutside]);
    useEffect(() => {
      // tslint:disable-next-line strict-type-predicates
      if (typeof window !== 'undefined' && unmount && hasTransition(props)) {
        if (propVisible) {
          setTransitioning(true);
          requestAnimationFrame(() => {
            setTransitioning(false);
            setVisible(true);
          });
        } else {
          setTransitioning(true);
          setVisible(false);
        }
      } else {
        setVisible(propVisible);
      }
    }, [propVisible, setTransitioning, setVisible, ...getTransitionArray(props)]);

    if (unmount && !visible && !transitioning) {
      return null;
    }

    const rest = excludeTransition(props);

    return (
      <Box
        {...rest}
        ref={ref}
        aria-hidden={!visible}
        hidden={!visible && !hasTransition(props)}
        onTransitionEnd={callAll(handleTransitionEnd, rest.onTransitionEnd)}
      />
    );
  },
);

export const Hidden = styled(HiddenComponent)<{
  readonly duration?: string;
  readonly timing?: string;
  readonly delay?: string;
}>`
  transform: ${translateWithProps};
  ${ifProp(
    hasTransition,
    css`
      transform-origin: ${originWithProps};
      transition: all ${prop('duration')} ${prop('timing')} ${prop('delay')};
    `,
  )};
  &[aria-hidden='true'] {
    pointer-events: none;
    ${ifProp('fade', 'opacity: 0')};
    ${ifProp(
      hasTransition,
      css`
        transform: ${slideWithProps} ${scaleWithProps};
        visibility: hidden;
        will-change: transform, opacity;
      `,
      'display: none !important',
    )};
  }
  ${theme('Hidden')};
`;

Hidden.defaultProps = {
  duration: '250ms',
  timing: 'ease-in-out',
};
