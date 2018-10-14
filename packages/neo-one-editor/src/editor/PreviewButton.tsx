// tslint:disable no-null-keyword
import * as React from 'react';
import { MdOpenInBrowser } from 'react-icons/md';
import { connect } from 'react-redux';
import { Button, Grid, styled } from 'reakit';
import { ifProp, prop } from 'styled-tools';
import { closePreview, EditorState, openPreview, selectPreviewEnabled, selectPreviewOpen } from './redux';

const Wrapper = styled(Grid)`
  place-items: center;
`;

const StyledButton = styled(Button)<{ readonly open: boolean }>`
  color: ${ifProp('open', prop('theme.gray0'), prop('theme.gray3'))};
  cursor: pointer;
  outline: none;
`;

interface Props {
  readonly previewEnabled: boolean;
  readonly previewOpen: boolean;
  readonly onOpenPreview: () => void;
  readonly onClosePreview: () => void;
}

const PreviewButtonBase = ({ previewOpen, previewEnabled, onOpenPreview, onClosePreview, ...props }: Props) =>
  previewEnabled ? (
    <StyledButton {...props} open={previewOpen} onClick={previewOpen ? onClosePreview : onOpenPreview}>
      <Wrapper>
        <MdOpenInBrowser />
      </Wrapper>
    </StyledButton>
  ) : null;

export const PreviewButton = connect(
  (state: EditorState) => ({
    ...selectPreviewOpen(state),
    ...selectPreviewEnabled(state),
  }),
  (dispatch) => ({
    onOpenPreview: () => dispatch(openPreview()),
    onClosePreview: () => dispatch(closePreview()),
  }),
)(PreviewButtonBase);
