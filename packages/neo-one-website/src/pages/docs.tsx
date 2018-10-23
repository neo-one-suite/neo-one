// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import { Redirect } from '@reach/router';
import * as React from 'react';
import { RouteData } from 'react-static';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { DocFooter, Helmet, SectionData, Sidebar } from '../components';
import { Markdown } from '../elements';
import { CoreLayout, DocsLoading } from '../layout';
import { AdjacentInfo } from '../utils';

const StyledMarkdown = styled(Markdown)`
  grid-area: markdown;
  padding-left: 240px;
  padding-right: 240px;

  @media (max-width: ${prop('theme.breakpoints.lg')}) {
    padding-left: 16px;
    padding-right: 16px;
  }
`;

const StyledSidebar = styled(Sidebar)`
  grid-area: sidebar;
`;

const StyledDocFooter = styled(DocFooter)`
  grid-area: footer;
`;

const StyledGrid = styled(Grid)`
  grid:
    'markdown sidebar' auto
    'footer sidebar' auto
    / 1fr 380px;
  grid-gap: 0;
  height: 100%;
  overflow-wrap: break-word;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid:
      'sidebar' auto
      'markdown' auto
      'footer' auto
      / 100%;
  }
`;

interface DocData {
  readonly doc: string;
  readonly title: string;
  readonly sidebar: ReadonlyArray<SectionData>;
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

// tslint:disable-next-line:no-default-export export-name
export default () => (
  // @ts-ignore
  <RouteData Loader={DocsLoading}>
    {(props?: DocData) => {
      if (props === undefined) {
        return <Redirect to="/docs/getting-started" />;
      }
      const { doc, title, next, previous, sidebar } = props;

      return (
        <CoreLayout>
          <Helmet title={`${title} - NEO•ONE`} />
          <StyledGrid>
            <StyledMarkdown source={doc} />
            <StyledSidebar sections={sidebar} />
            <StyledDocFooter next={next} previous={previous} />
          </StyledGrid>
        </CoreLayout>
      );
    }}
  </RouteData>
);
