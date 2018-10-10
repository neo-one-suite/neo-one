import * as React from 'react';
import { List, styled } from 'reakit';
import { SectionTitleLink } from './SectionTitleLink';
import { SubsectionList } from './SubsectionList';

export interface Props {
  readonly subsections: ReadonlyArray<string>;
  readonly section: string;
  readonly onClick?: () => void;
}

const TutorialList = styled(List)`
  list-style-type: none;
`;

export const Section = ({ subsections, section, onClick, ...props }: Props) => (
  <TutorialList {...props}>
    <SectionTitleLink title={section} onClick={onClick} />
    <SubsectionList subsections={subsections} onClick={onClick} />
  </TutorialList>
);
