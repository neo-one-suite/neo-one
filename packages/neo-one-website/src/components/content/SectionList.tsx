// tslint:disable no-null-keyword
import { List } from '@neo-one/react-common';
import React from 'react';
import styled from 'styled-components';
import { ifProp } from 'styled-tools';
import { SubsectionData } from '../../types';
import { SubsectionLink, TutorialSubsectionLink } from './SubsectionLink';

interface SubsectionProps {
  readonly current: string;
  readonly subsection: SubsectionData;
  readonly index?: number;
  readonly onClickLink?: () => void;
}

const Subsection = ({ current, index, subsection, onClickLink, ...props }: SubsectionProps) => {
  const LinkFunc = subsection.slug.includes('/tutorial#') ? TutorialSubsectionLink : SubsectionLink;

  return (
    <LinkFunc
      active={current === subsection.slug}
      title={subsection.title}
      slug={subsection.slug}
      index={index}
      onClick={onClickLink}
      {...props}
    >
      {subsection.subsections === undefined ? null : (
        <SectionList current={current} subsections={subsection.subsections} onClickLink={onClickLink} indent />
      )}
    </LinkFunc>
  );
};

interface Props {
  readonly current: string;
  readonly subsections: readonly SubsectionData[];
  readonly onClickLink?: () => void;
  readonly indent?: boolean;
  readonly numbered?: boolean;
}

const Wrapper = styled(List)<{ readonly indent: boolean }>`
  list-style-type: none;
  ${ifProp('indent', 'margin-left: 16px', '')};
`;

export const SectionList = ({ numbered, current, subsections, indent = false, onClickLink, ...props }: Props) => (
  <Wrapper indent={indent} {...props}>
    {subsections.map((subsection, idx) => (
      <Subsection
        key={subsection.slug}
        index={numbered ? idx : undefined}
        current={current}
        subsection={subsection}
        onClickLink={onClickLink}
      />
    ))}
  </Wrapper>
);
