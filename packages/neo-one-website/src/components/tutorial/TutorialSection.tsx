// @ts-ignore
import { ViewportConsumer } from '@render-props/viewport';
import * as React from 'react';
import { List, styled } from 'reakit';
import { SectionData, SidebarLink } from '../common';
import { InViewAPI, InViewSidebarLink } from './InViewSidebarLink';
import { SubsectionList } from './SubsectionList';

interface Props extends SectionData {
  readonly sections: ReadonlyArray<string>;
  readonly activeSection?: string;
  readonly setActiveSection: (section: string) => void;
}

const StyledList = styled(List)`
  list-style-type: none;
`;

export const slugify = (title: string) => title.toLowerCase().replace(' ', '-');

export const TutorialSection = ({
  subsections,
  section,
  sections,
  activeSection,
  setActiveSection,
  upstreamHidden,
  ...props
}: Props) => {
  const path = `#${slugify(section)}`;

  return (
    <StyledList {...props}>
      <ViewportConsumer>
        {({ inViewY }: InViewAPI) => {
          const idx = sections.indexOf(section);
          if (
            inViewY(document.getElementById(slugify(section))) &&
            activeSection !== section &&
            !(idx > 0 && inViewY(document.getElementById(slugify(sections[idx - 1]))))
          ) {
            setActiveSection(section);
          }

          if (activeSection === section) {
            return <InViewSidebarLink title={section} path={path} hidden={upstreamHidden} />;
          }

          return <SidebarLink title={section} path={path} hidden={upstreamHidden} />;
        }}
      </ViewportConsumer>
      <SubsectionList
        subsections={subsections}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sections={sections}
        hidden={upstreamHidden}
      />
    </StyledList>
  );
};
