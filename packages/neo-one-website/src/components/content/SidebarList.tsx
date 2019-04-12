import { Box, useHidden, usePrevious } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { SectionData } from '../../types';
import { Section } from './Section';

const { useEffect } = React;

const Wrapper = styled(Box)`
  background-color: ${prop('theme.gray1')};
  padding-top: 16px;
  padding-bottom: 16px;
  padding-left: 16px;
  padding-right: 16px;
  height: 100%;

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    padding-top: 64px;
    padding-bottom: 64px;
    padding-left: 40px;
    padding-right: 40px;
  }
`;

interface SidebarListItemProps {
  readonly current: string;
  readonly section: SectionData;
  readonly onClickLink?: () => void;
}

const SidebarListItem = ({ current, section, onClickLink, ...props }: SidebarListItemProps) => {
  const { visible, show, toggle } = useHidden(section.subsections.some((subsection) => current === subsection.slug));
  const prevCurrent = usePrevious(current);
  useEffect(() => {
    if (current !== prevCurrent && !visible && section.subsections.some((subsection) => current === subsection.slug)) {
      show();
    }
  }, [current, visible, prevCurrent, show, section]);

  return (
    <Section
      {...props}
      current={current}
      section={section}
      visible={visible}
      toggle={toggle}
      onClickLink={onClickLink}
    />
  );
};

interface Props {
  readonly current: string;
  readonly sections: ReadonlyArray<SectionData>;
  readonly alwaysVisible: boolean;
  readonly onClickLink?: () => void;
}

export const SidebarList = ({ sections, current, alwaysVisible, onClickLink, ...props }: Props) => (
  <Wrapper {...props}>
    {sections.map((section) =>
      alwaysVisible ? (
        <Section key={section.title} current={current} section={section} visible onClickLink={onClickLink} />
      ) : (
        <SidebarListItem key={section.title} current={current} section={section} onClickLink={onClickLink} />
      ),
    )}
  </Wrapper>
);
