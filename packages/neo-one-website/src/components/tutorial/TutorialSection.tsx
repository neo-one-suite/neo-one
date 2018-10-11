import * as React from 'react';
import { List, styled } from 'reakit';
import { SectionData, SidebarLink } from '../common';
import { SubsectionList } from './SubsectionList';

interface Props extends SectionData {}

const StyledList = styled(List)`
  list-style-type: none;
`;

export const slugify = (title: string) => title.toLowerCase().replace(' ', '-');

export const TutorialSection = ({ subsections, section, upstreamHidden, ...props }: Props) => {
  const path = `#${slugify(section)}`;

  return (
    <StyledList {...props}>
      <SidebarLink title={section} path={path} hidden={upstreamHidden} />
      <SubsectionList subsections={subsections} hidden={upstreamHidden} />
    </StyledList>
  );
};
