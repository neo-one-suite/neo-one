// @ts-ignore
import { ViewportConsumer } from '@render-props/viewport';
import * as React from 'react';
import { List, styled } from 'reakit';
import { HiddenAPI, SidebarLink, SubsectionData } from '../common';
import { InViewAPI, InViewSidebarLink } from './InViewSidebarLink';
import { slugify } from './TutorialSection';

export interface Props {
  readonly subsections: ReadonlyArray<SubsectionData>;
  readonly hidden?: HiddenAPI;
  readonly activeSection?: string;
  readonly setActiveSection: (section: string) => void;
  readonly sections: ReadonlyArray<string>;
}

const Wrapper = styled(List)`
  list-style-type: none;
  padding-inline-start: 16px;
`;

export const SubsectionList = ({ subsections, activeSection, setActiveSection, sections, hidden, ...props }: Props) => (
  <Wrapper {...props}>
    {subsections.map((subsection) => {
      const path = `#${subsection.slug}`;

      return (
        <ViewportConsumer>
          {({ inViewY }: InViewAPI) => {
            const idx = sections.indexOf(subsection.title);
            if (
              inViewY(document.getElementById(subsection.slug)) &&
              activeSection !== subsection.title &&
              !(idx > 0 && inViewY(document.getElementById(slugify(sections[idx - 1]))))
            ) {
              setActiveSection(subsection.title);
            }

            if (activeSection === subsection.title) {
              return <InViewSidebarLink title={subsection.title} path={path} hidden={hidden} />;
            }

            return <SidebarLink title={subsection.title} path={path} hidden={hidden} />;
          }}
        </ViewportConsumer>
      );
    })}
  </Wrapper>
);
