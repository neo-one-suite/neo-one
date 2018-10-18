// tslint:disable no-null-keyword
import { Button } from '@neo-one/react-common';
import * as React from 'react';
import { connect } from 'react-redux';
import { Grid, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { CourseState, selectChapterProgress } from '../redux';
import { SelectedChapter } from '../types';
import { DocsSolution } from './DocsSolution';
import { NextButton } from './NextButton';
import { PreviousButton } from './PreviousButton';

const Wrapper = styled(Grid)`
  grid:
    'solution' auto
    'footer' auto
    / auto;
  grid-gap: 0;
  min-height: 0;
  border-top: 1px solid ${prop('theme.gray5')};
`;

const FooterWrapperBase = styled(Grid)`
  grid-gap: 8px;
  padding: 8px;
  grid-auto-flow: column;
  grid-auto-columns: auto;
`;

const FooterWrapper = styled(FooterWrapperBase)`
  justify-content: space-between;
`;

const FooterLeftWrapper = styled(FooterWrapperBase)`
  justify-content: start;
`;

const FooterRightWrapper = styled(FooterWrapperBase)`
  justify-content: end;
`;

const StyledHidden = styled(Hidden)`
  display: flex;
  min-height: 0;
`;

interface ExternalProps {
  readonly selected: SelectedChapter;
}

interface Props extends ExternalProps {
  readonly complete: boolean;
}

const DocsFooterBase = ({ selected, complete, ...props }: Props) => (
  <Hidden.Container>
    {(hidden) => (
      <Wrapper>
        <StyledHidden {...hidden}>
          <DocsSolution selected={selected} />
        </StyledHidden>
        <FooterWrapper {...props}>
          <FooterLeftWrapper>
            <PreviousButton selected={selected} onClick={hidden.hide} />
          </FooterLeftWrapper>
          <FooterRightWrapper>
            <Hidden.Toggle data-test="docs-footer-solution-button" as={Button} {...hidden}>
              {hidden.visible ? 'Hide' : 'Show'} Solution
            </Hidden.Toggle>
            <NextButton selected={selected} onClick={hidden.hide} complete={complete} />
          </FooterRightWrapper>
        </FooterWrapper>
      </Wrapper>
    )}
  </Hidden.Container>
);

export const DocsFooter = connect((state: CourseState, { selected }: ExternalProps) => ({
  complete: selectChapterProgress(state, selected),
}))(DocsFooterBase);
