// tslint:disable no-null-keyword
import * as React from 'react';
import styled from 'styled-components';
import { theme } from 'styled-tools';
import { Box } from './Box';
import { Toolbar } from './Toolbar';
import { callAll, getSelector } from './utils';

const { forwardRef, useState, useCallback, useLayoutEffect, useRef } = React;

type Focusable = (Element | Text) & {
  readonly focus: () => void;
};

export interface ToolbarFocusableProps {
  readonly disabled?: boolean;
  readonly tabIndex?: number;
  readonly onFocus?: React.FocusEventHandler;
}

type Props = ToolbarFocusableProps & React.ComponentPropsWithoutRef<typeof Box>;

export const ToolbarFocusableComponent = forwardRef<HTMLDivElement, Props>(
  ({ disabled, tabIndex: propTabIndex = -1, onFocus, ...props }, refIn) => {
    const myRef = useRef<HTMLDivElement>(null);
    const ref = refIn === null ? myRef : (refIn as React.RefObject<HTMLDivElement>);
    const toolbarRef = useRef<Element | null>(null);
    const firstRender = useRef(true);

    const [tabIndex, setTabIndex] = useState(propTabIndex);

    const getToolbar = useCallback(() => {
      if (toolbarRef.current === null && ref.current !== null) {
        // tslint:disable-next-line:no-object-mutation
        toolbarRef.current = ref.current.closest(getSelector(Toolbar));
      }

      return toolbarRef.current;
    }, [ref, toolbarRef]);

    const getFocusables = useCallback((): NodeListOf<Focusable> | undefined => {
      const toolbar = getToolbar();

      if (toolbar === null) {
        return undefined;
      }

      return toolbar.querySelectorAll(getSelector(ToolbarFocusable)) as NodeListOf<Focusable>;
    }, [getToolbar]);

    const getCurrentIndex = useCallback(
      (focusables: NodeListOf<Focusable> | undefined) => {
        if (focusables === undefined) {
          return -1;
        }

        let currentIndex = -1;
        focusables.forEach((item: Element | Text | null, i: number) => {
          if (item === ref.current) {
            currentIndex = i;
          }
        });

        return currentIndex;
      },
      [ref],
    );

    const toolbarIsVertical = useCallback(() => {
      const toolbar = getToolbar();

      return toolbar !== null && toolbar.getAttribute('aria-orientation') === 'vertical';
    }, [toolbar]);

    const getPreviousFocusable = useCallback((focusables: NodeListOf<Focusable>, currentIndex: number) => {
      const index = currentIndex ? currentIndex - 1 : focusables.length - 1;

      return focusables.item(index);
    }, []);

    const getNextFocusable = useCallback((focusables: NodeListOf<Focusable>, currentIndex: number) => {
      const index = currentIndex + 1;

      // tslint:disable-next-line strict-boolean-expressions
      return focusables.item(index) || focusables.item(0);
    }, []);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        const isVertical = toolbarIsVertical();
        const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
        const previousKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
        const willPerformEvent = [nextKey, previousKey].indexOf(e.key) >= 0;

        if (willPerformEvent) {
          const focusables = getFocusables();
          if (focusables !== undefined) {
            const currentIndex = getCurrentIndex(focusables);

            e.preventDefault();
            setTabIndex(propTabIndex);

            if (e.key === nextKey) {
              getNextFocusable(focusables, currentIndex).focus();
            } else {
              getPreviousFocusable(focusables, currentIndex).focus();
            }
          }
        }
      },
      [toolbarIsVertical, getFocusables, getCurrentIndex, propTabIndex, getNextFocusable, getPreviousFocusable],
    );

    const handleFocus = useCallback(() => setTabIndex(0), [setTabIndex]);

    useLayoutEffect(() => {
      if (firstRender.current && tabIndex === -1) {
        // tslint:disable-next-line:no-object-mutation
        firstRender.current = false;
        setTabIndex(getCurrentIndex(getFocusables()));
      }

      if (!disabled && ref.current !== null) {
        ref.current.addEventListener('keydown', handleKeyDown);
      }

      return () => {
        if (ref.current !== null) {
          ref.current.removeEventListener('keydown', handleKeyDown);
        }
      };
    }, [tabIndex, disabled, setTabIndex, getCurrentIndex, getFocusables, ref]);

    return <Box {...props} ref={ref} onFocus={callAll(handleFocus, onFocus)} tabIndex={tabIndex} />;
  },
);

export const ToolbarFocusable = styled(ToolbarFocusableComponent)`
  ${theme('ToolbarFocusable')};
`;
