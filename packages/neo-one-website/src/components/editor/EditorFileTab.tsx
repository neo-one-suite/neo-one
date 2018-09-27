import * as React from 'react';
import { Button, styled } from 'reakit';
import { ifProp, prop, withProp } from 'styled-tools';
import { EditorFileDisplay } from './EditorFileDisplay';
import { EditorFile } from './types';

const Wrapper = styled(Button)<{ readonly first: boolean; readonly selected: boolean }>`
  color: ${ifProp('selected', prop('theme.gray0'), prop('theme.gray2'))};
  background-color: ${ifProp('selected', prop('theme.lightBlack'), prop('theme.gray5'))};
  ${prop('theme.fontStyles.body1')};
  padding: 8px;
  cursor: pointer;
  ${ifProp('first', '', withProp('theme.lightBlack', (color) => `border-left: 2px solid ${color}`))};
  outline: none;
`;

interface Props {
  readonly first: boolean;
  readonly selected: boolean;
  readonly file: EditorFile;
  readonly onSelectFile: (file: EditorFile) => void;
}

export const EditorFileTab = ({ first, file, selected, onSelectFile, ...props }: Props) => (
  <Wrapper first={first} selected={selected} onClick={() => onSelectFile(file)} {...props}>
    <EditorFileDisplay file={file} />
  </Wrapper>
);
