// tslint:disable no-null-keyword
import styled from '@emotion/styled';
import { Box, ButtonBase, ifProp, prop } from '@neo-one/react-common';
import * as React from 'react';
import { MdOpenInBrowser } from 'react-icons/md';
import { connect } from 'react-redux';
import { closePreview, EditorState, openPreview, selectPreviewEnabled, selectPreviewOpen } from './redux';

const Wrapper = styled(Box)`
  display: grid;
  place-items: center;
`;

const StyledButton = styled(ButtonBase)<{ readonly open: boolean }>`
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
