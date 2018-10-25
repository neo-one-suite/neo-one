// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import { Redirect } from '@reach/router';
import * as React from 'react';
import { RouteData } from 'react-static';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { BlogSection, Helmet, SectionData, Sidebar, SidebarHeader } from '../components';
import { Markdown } from '../elements';
import { CoreLayout, DocsLoading } from '../layout';
import { BlogInfo } from '../utils';

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

interface Props extends BlogInfo {
  readonly mostRecentBlogPostSlug: string;
}

// tslint:disable-next-line:no-default-export export-name
export default () => (
  // @ts-ignore
  <RouteData Loader={DocsLoading}>
    {(props?: Props) => {
      if (props === undefined) {
        return <Redirect to="/blog/all" />;
      }
      const { content, sidebar } = props;

      return (
        <CoreLayout path="blog">
          <Helmet title="Blog" />
          <StyledGrid>
            <StyledMarkdown source={content} linkColor="accent" />
            <StyledSidebar
              sections={sidebar}
              renderSidebarHeader={() => <SidebarHeader title="Recent Posts" />}
              renderSection={(sectionProps: SectionData) => <BlogSection {...sectionProps} numSections={10} />}
            />
          </StyledGrid>
        </CoreLayout>
      );
    }}
  </RouteData>
);
