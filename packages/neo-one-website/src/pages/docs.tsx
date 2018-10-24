// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import { Redirect } from '@reach/router';
import * as React from 'react';
import { RouteData } from 'react-static';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { DocFooter, DocSection, Helmet, SectionData, Sidebar } from '../components';
import { Markdown } from '../elements';
import { CoreLayout, DocsLoading } from '../layout';
import { AdjacentInfo } from '../utils';

const StyledMarkdown = styled(Markdown)`
  ${prop('theme.fonts.axiformaBook')};
  color: ${prop('theme.black')};
  max-width: 42em;

  & h1 {
    ${prop('theme.fontStyles.display3')};
    margin-top: 16px;
    margin-bottom: 24px;
  }

  & > p:nth-child(2) {
    ${prop('theme.fonts.axiformaThin')};
    ${prop('theme.fontStyles.headline')};
    color: ${prop('theme.gray6')};
    margin-bottom: 40px;
    margin-top: 40px;
  }
`;

const MarkdownWrapper = styled(Grid)`
  grid-area: markdown;
  justify-items: center;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 64px;
  padding-bottom: 64px;
  width: 90%;
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
  readonly mostRecentBlogPostSlug: string;
}

// tslint:disable-next-line:no-default-export export-name
export default () => (
  // @ts-ignore
  <RouteData Loader={DocsLoading}>
    {(props?: DocData) => {
      if (props === undefined) {
        return <Redirect to="/docs/getting-started" />;
      }
      const { doc, title, next, previous, sidebar, mostRecentBlogPostSlug } = props;

      return (
        <CoreLayout path="docs" mostRecentBlogPostSlug={mostRecentBlogPostSlug}>
          <Helmet title={`${title} - NEO•ONE`} />
          <StyledGrid>
            <MarkdownWrapper>
              <StyledMarkdown source={doc} linkColor="accent" />
            </MarkdownWrapper>
            <StyledSidebar
              sections={sidebar}
              renderSection={(sectionProps: SectionData) => <DocSection {...sectionProps} />}
              initialVisibleMobile
            />
            <StyledDocFooter next={next} previous={previous} />
          </StyledGrid>
        </CoreLayout>
      );
    }}
  </RouteData>
);
