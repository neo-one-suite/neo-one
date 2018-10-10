import * as React from 'react';
import { List, styled } from 'reakit';
import { Props as SubsectionProps, Subsection } from './Subsection';

export interface Props {
  readonly subsections: ReadonlyArray<SubsectionProps>;
  readonly onClick?: () => void;
}

const DocList = styled(List)`
  list-style-type: none;
`;

export const SectionList = ({ subsections, onClick, ...props }: Props) => (
  <DocList {...props}>
    {subsections.map((subection) => (
      <Subsection slug={subection.slug} title={subection.title} onClick={onClick} />
    ))}
  </DocList>
);
