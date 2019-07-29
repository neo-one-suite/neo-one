// tslint:disable no-null-keyword no-object-mutation
import styled from '@emotion/styled';
import { getSelector } from '@neo-one/react-core';
import Popper from 'popper.js';
import * as React from 'react';
import { theme } from 'styled-tools';
import { Hidden, HiddenProps } from './Hidden';
import { PopoverArrow } from './PopoverArrow';

const { forwardRef, useCallback, useEffect, useRef, useState } = React;

export interface PopoverProps extends HiddenProps {
  readonly role?: string;
  readonly hideOnEsc?: boolean;
  readonly placement?: Popper.Placement;
  readonly flip?: boolean;
  readonly shift?: boolean;
  readonly gutter?: number | string;
  readonly popoverId?: string;
}

const PopoverComponent = forwardRef<HTMLDivElement, PopoverProps & React.ComponentProps<typeof Hidden>>(
  (
    { placement: propPlacement = 'bottom' as Popper.Placement, popoverId, gutter, flip = true, shift = true, ...props },
    refIn,
  ) => {
    const myRef = useRef<HTMLDivElement>(null);
    const ref = refIn === null ? myRef : (refIn as React.RefObject<HTMLDivElement>);
    const [placement, setPlacement] = useState(propPlacement);
    const [translateX, setTranslateX] = useState<number | string | undefined>(undefined);
    const [translateY, setTranslateY] = useState<number | string | undefined>(undefined);
    const [originX, setOriginX] = useState<number | string | undefined>(undefined);
    const [originY, setOriginY] = useState<number | string | undefined>(undefined);
    const popperRef = useRef<Popper | null>(null);

    const modifier = useCallback(
      (data: Popper.Data) => {
        const { placement: dataPlacement, offsets, arrowElement, arrowStyles } = data;
        const { reference, popper } = offsets;
        const [position] = dataPlacement.split('-');
        const isVertical = ['top', 'bottom'].indexOf(position) >= 0;

        const referenceCenter = isVertical ? reference.width / 2 : reference.height / 2;
        const side = isVertical ? 'left' : 'top';
        const sideValue = referenceCenter - popper[side];

        // tslint:disable-next-line strict-boolean-expressions
        if (arrowElement) {
          const { top, left } = arrowStyles;
          // tslint:disable-next-line:no-any
          (arrowElement as any).style.top = isVertical ? '' : `${top}px`;
          // tslint:disable-next-line:no-any
          (arrowElement as any).style.left = isVertical ? `${left}px` : '';
        }

        setOriginX(isVertical ? `${sideValue}px - 50%` : 0);
        setOriginY(!isVertical ? `${sideValue}px - 50%` : 0);
        setTranslateX(Math.round(popper.left));
        setTranslateY(Math.round(popper.top));
        setPlacement(data.placement);

        return data;
      },
      [setOriginX, setOriginY, setTranslateX, setTranslateY, setPlacement],
    );

    useEffect(() => {
      const popper = popperRef.current;
      const popover = ref.current;
      if (popper === null && popover !== null && popover.parentNode !== null) {
        const arrow = popover.querySelector(getSelector(PopoverArrow));

        popperRef.current = new Popper(popover.parentNode as Element, popover, {
          placement: propPlacement,
          modifiers: {
            hide: { enabled: false },
            applyStyle: { enabled: false },
            // tslint:disable-next-line strict-boolean-expressions
            arrow: arrow ? { enabled: !!arrow, element: arrow } : undefined,
            flip: { enabled: flip, padding: 16 },
            preventOverflow: {
              enabled: true,
              boundariesElement: 'window',
            },
            shift: { enabled: shift },
            offset: { offset: `0, ${gutter}` },
            setState: {
              order: 900,
              enabled: true,
              fn: modifier,
            },
          },
        });
      }

      return () => {
        const innerPopper = popperRef.current;
        if (innerPopper !== null) {
          innerPopper.destroy();
          popperRef.current = null;
        }
      };
    }, [props.visible, propPlacement, flip, shift, gutter, props.children, modifier, ref]);

    // tslint:disable-next-line no-any strict-type-predicates
    const defaultPlacement = placement === undefined ? undefined : (placement.replace(/-.+$/, '') as any);

    return (
      <Hidden
        id={popoverId}
        ref={ref}
        translateX={translateX}
        translateY={translateY}
        originX={originX}
        originY={originY}
        data-placement={placement}
        defaultSlide={defaultPlacement}
        defaultExpand={defaultPlacement}
        slideOffset={gutter}
        {...props}
        unmount={false}
      />
    );
  },
);

export const Popover = styled(PopoverComponent)`
  position: absolute;
  top: 0;
  left: 0;
  user-select: auto;
  cursor: auto;
  z-index: 999;
  ${theme('Popover')};
`;

Popover.defaultProps = {
  role: 'group',
  placement: 'bottom',
  hideOnEsc: true,
  flip: true,
  shift: true,
  gutter: 12,
  opaque: true,
  palette: 'white',
};
