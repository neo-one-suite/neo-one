import * as React from 'react';
import { connect } from 'react-redux';
import { Button, styled } from 'reakit';
import { ifProp, prop } from 'styled-tools';
import { selectFile } from '../redux';
import { ChapterFile, SelectedChapter } from '../types';

const Wrapper = styled(Button)<{ readonly selected: boolean }>`
  color: ${prop('theme.gray0')};
  background-color: ${ifProp('selected', prop('theme.lightBlack'), prop('theme.gray5'))};
  ${prop('theme.fontStyles.body1')};
  padding: 8px;
  cursor: pointer;
  border-left: 2px solid ${prop('theme.lightBlack')};
  outline: none;
`;
interface ExternalProps {
  readonly selected: SelectedChapter;
  readonly file: ChapterFile;
}
interface Props extends ExternalProps {
  readonly onClick: () => void;
}
const EditorFileTabBase = ({ file, onClick }: Props) => (
  <Wrapper selected={file.selected} onClick={onClick}>
    {file.path}
    {file.current === undefined ? ' (read-only)' : ''}
  </Wrapper>
);

export const EditorFileTab = connect(
  undefined,
  (dispatch, { selected, file }: ExternalProps) => ({
    onClick: () => dispatch(selectFile({ ...selected, path: file.path })),
  }),
)(EditorFileTabBase);
