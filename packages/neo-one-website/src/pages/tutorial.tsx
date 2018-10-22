// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { withRouteData } from 'react-static';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Helmet, Sidebar } from '../components';
import { Markdown } from '../elements';
import { CoreLayout } from '../layout';
import { TutorialInfo } from '../utils';

const StyledSidebar = styled(Sidebar)`
  grid-area: sidebar;
`;

const StyledMarkdown = styled(Markdown)`
  grid-area: markdown;
  padding-left: 240px;
  padding-right: 240px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    padding-left: 16px;
    padding-right: 16px;
  }
`;

const StyledGrid = styled(Grid)`
  grid:
    'markdown sidebar' auto
    / 1fr 380px;
  grid-gap: 0;
  height: 100%;
  overflow-wrap: break-word;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid:
      'sidebar' auto
      'markdown' auto
      / 100%;
  }
`;

// tslint:disable-next-line export-name no-default-export
export default withRouteData(({ tutorial, sections }: TutorialInfo) => (
  <CoreLayout>
    <Helmet title="Tutorial: Into to NEO•ONE - NEO•ONE" />
    <StyledGrid>
      <StyledMarkdown source={tutorial} />
      <StyledSidebar sections={sections} tutorial />
    </StyledGrid>
  </CoreLayout>
));
