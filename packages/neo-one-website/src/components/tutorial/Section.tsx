import * as React from 'react';
import { Box, styled } from 'reakit';
import { SectionTitleLink } from './SectionTitleLink';
import { SubsectionList } from './SubsectionList';

export interface Props {
  readonly subsections: ReadonlyArray<string>;
  readonly section: string;
  readonly onClick?: () => void;
}

const List = styled(Box.as('ul'))`
  list-style-type: none;
`;

export const Section = ({ subsections, section, onClick }: Props) => (
  <List>
    <SectionTitleLink title={section} onClick={onClick} />
    <SubsectionList subsections={subsections} onClick={onClick} />
  </List>
);
