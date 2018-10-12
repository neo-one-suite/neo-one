// tslint:disable-next-line no-import-side-effect
import '../polyfill';

// @ts-ignore
import { ViewportProvider } from '@render-props/viewport';
import * as React from 'react';
import { RouteData } from 'react-static';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Helmet, Sidebar } from '../components';
import { Markdown } from '../elements';
import { CoreLayout, DocsLoading } from '../layout';
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

// tslint:disable-next-line:no-default-export export-name
export default () => (
  // @ts-ignore
  <RouteData Loader={DocsLoading}>
    {({ tutorial, sections }: TutorialInfo) => (
      <ViewportProvider>
        <CoreLayout path="tutorial">
          <Helmet title="Tutorial: Into to NEO•ONE - NEO•ONE" />
          <StyledGrid>
            <StyledMarkdown source={tutorial} linkColor="accent" />
            <StyledSidebar sections={sections} tutorial />
          </StyledGrid>
        </CoreLayout>
      </ViewportProvider>
    )}
  </RouteData>
);
