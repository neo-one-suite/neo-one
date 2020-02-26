import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
// @ts-ignore
import Scrollable from '@render-props/scrollable';
import * as React from 'react';
import { connect } from 'react-redux';
import { ifProp, prop } from 'styled-tools';
import {
  ConsoleOutput as ConsoleOutputType,
  EditorState,
  selectConsoleOutput,
  selectConsoleOutputOwner,
} from '../redux';

// tslint:disable-next-line: no-any
const Wrapper = styled(Box)<any>`
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  overflow-y: auto;
  overflow-wrap: break-word;
  padding-left: 16px;
  padding-right: 16px;
  ${ifProp('shadowed', 'box-shadow: inset 0 10px 10px -5px rgba(0, 0, 0, 0.25)')};
  white-space: pre-wrap;
`;

interface Props {
  readonly consoleOutput: ConsoleOutputType;
  readonly consoleOutputOwner: string;
}

const ConsoleOutputBase = ({ consoleOutput, consoleOutputOwner }: Props) => (
  <Scrollable>
    {/* tslint:disable-next-line:no-any */}
    {({ scrollRef, scrollY, max, scrollToY, clientHeight }: any) => {
      if (clientHeight !== 0 && scrollY !== max.y) {
        scrollToY(max.y);
      }

      let output = consoleOutput[consoleOutputOwner];
      if (output === undefined) {
        output = '';
      }

      return (
        <Wrapper data-test="console-output" ref={scrollRef} shadowed={scrollY > 0}>
          {output}
        </Wrapper>
      );
    }}
  </Scrollable>
);

export const ConsoleOutput = connect((state: EditorState) => ({
  ...selectConsoleOutput(state),
  ...selectConsoleOutputOwner(state),
}))(ConsoleOutputBase);
