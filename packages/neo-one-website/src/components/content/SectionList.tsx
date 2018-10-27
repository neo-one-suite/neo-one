// tslint:disable no-null-keyword
import * as React from 'react';
import { List, styled } from 'reakit';
import { ifProp } from 'styled-tools';
import { SubsectionData } from '../../types';
import { SubsectionLink } from './SubsectionLink';

interface SubsectionProps {
  readonly current: string;
  readonly subsection: SubsectionData;
  readonly onClickLink?: () => void;
}

const Subsection = ({ current, subsection, onClickLink, ...props }: SubsectionProps) => (
  <SubsectionLink
    active={current === subsection.slug}
    title={subsection.title}
    slug={subsection.slug}
    onClick={onClickLink}
    {...props}
  >
    {subsection.subsections === undefined ? null : (
      <SectionList current={current} subsections={subsection.subsections} onClickLink={onClickLink} indent />
    )}
  </SubsectionLink>
);

interface Props {
  readonly current: string;
  readonly subsections: ReadonlyArray<SubsectionData>;
  readonly onClickLink?: () => void;
  readonly indent?: boolean;
}

const Wrapper = styled(List)<{ readonly indent: boolean }>`
  list-style-type: none;
  ${ifProp('indent', 'margin-left: 16px', '')};
`;

export const SectionList = ({ current, subsections, indent = false, onClickLink, ...props }: Props) => (
  <Wrapper indent={indent} {...props}>
    {subsections.map((subsection) => (
      <Subsection key={subsection.slug} current={current} subsection={subsection} onClickLink={onClickLink} />
    ))}
  </Wrapper>
);
