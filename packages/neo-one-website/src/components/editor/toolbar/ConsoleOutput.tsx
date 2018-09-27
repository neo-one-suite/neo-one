// tslint:disable no-any
// @ts-ignore
import Scrollable from '@render-props/scrollable';
import * as React from 'react';
import { connect } from 'react-redux';
import { styled } from 'reakit';
import { ifProp, prop } from 'styled-tools';
import { selectConsoleOutput } from '../redux';

const Wrapper = styled.div<{ readonly shadowed: boolean }>`
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  overflow-y: scroll;
  overflow-wrap: break-word;
  padding-left: 16px;
  padding-right: 16px;
  ${ifProp('shadowed', 'box-shadow: inset 0 10px 10px -5px rgba(0, 0, 0, 0.25)')};
`;

interface Props {
  readonly consoleOutput: string;
}

const ConsoleOutputBase = ({ consoleOutput }: Props) => (
  <Scrollable>
    {({ scrollRef, scrollY, max, scrollToY, clientHeight }: any) => {
      if (clientHeight !== 0 && scrollY !== max.y) {
        scrollToY(max.y);
      }

      return (
        <Wrapper innerRef={scrollRef} shadowed={scrollY > 0}>
          {consoleOutput}
        </Wrapper>
      );
    }}
  </Scrollable>
);

export const ConsoleOutput = connect(selectConsoleOutput)(ConsoleOutputBase);
