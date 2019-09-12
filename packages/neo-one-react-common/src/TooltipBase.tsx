// tslint:disable no-null-keyword no-object-mutation no-any
import styled from '@emotion/styled';
import * as React from 'react';
import { theme } from 'styled-tools';
import { Popover } from './Popover';

const { forwardRef, useEffect, useRef, useState } = React;

const TooltipBaseComponent = forwardRef<HTMLDivElement, React.ComponentPropsWithRef<typeof Popover>>((props, refIn) => {
  const myRef = useRef<HTMLDivElement>(null);
  const ref = refIn === null ? myRef : (refIn as React.RefObject<HTMLDivElement>);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    const node = ref.current;
    const parentNode = node === null ? undefined : node.parentNode === null ? undefined : node.parentNode;
    if (parentNode !== undefined && props.visible === undefined) {
      parentNode.addEventListener('mouseenter', show);
      parentNode.addEventListener('focus', show);
      parentNode.addEventListener('mouseleave', hide);
      parentNode.addEventListener('blur', hide);
    }

    return () => {
      if (parentNode !== undefined && props.visible === undefined) {
        parentNode.removeEventListener('mouseenter', show);
        parentNode.removeEventListener('focus', show);
        parentNode.removeEventListener('mouseleave', hide);
        parentNode.removeEventListener('blur', hide);
      }
    };
  }, [ref, setVisible, props.visible]);

  return <Popover {...props} ref={ref} visible={props.visible === undefined ? visible : props.visible} />;
});

// type instantiation is excessively deep and possibly
// @ts-ignore
export const TooltipBase: any = styled(TooltipBaseComponent)<{}, {}>`
  ${theme('TooltipBase')};
`;

TooltipBase.defaultProps = {
  role: 'tooltip',
  placement: 'top',
  opaque: true,
  palette: 'grayscale',
};
