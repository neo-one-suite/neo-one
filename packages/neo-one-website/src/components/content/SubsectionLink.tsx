// tslint:disable no-null-keyword
import styled from '@emotion/styled';
import { Link as BaseLink, styledOmitProps } from '@neo-one/react-common';
import React from 'react';
import { ifProp, prop } from 'styled-tools';
import { StyledRouterLink } from '../StyledRouterLink';

const getStyledLink = (linkFunc: typeof BaseLink) => styledOmitProps<{ readonly active: boolean }>(linkFunc, [
  'active',
])`
${ifProp('active', prop('theme.fonts.axiformaBold'), prop('theme.fonts.axiformaRegular'))};
${prop('theme.fontStyles.subheading')};

&:hover {
  color: ${prop('theme.accent')};
}

&:focus {
  color: ${prop('theme.accent')};
}

&.active {
  color: ${prop('theme.accent')};
}
`;

const Link = getStyledLink(StyledRouterLink);
const TutorialLink = getStyledLink(BaseLink);

const ActiveBorder = styled.span`
  width: 4px;
  height: 24px;
  border-left: 4px solid ${prop('theme.accent')};
  padding-left: 16px;
  position: absolute;
  left: -16px;
`;

const Wrapper = styled.li``;

interface Props {
  readonly active: boolean;
  readonly title: string;
  readonly slug: string;
  readonly index?: number;
  readonly onClick?: () => void;
  readonly children?: React.ReactNode;
}

export const SubsectionLink = ({ active, title, index, slug, children, ...props }: Props) => (
  <Wrapper {...props}>
    <Link active={active} linkColor="gray" to={slug}>
      {active ? <ActiveBorder /> : null}
      {index === undefined ? title : `${index}. ${title}`}
    </Link>
    {children}
  </Wrapper>
);

export const TutorialSubsectionLink = ({ active, title, index, slug, children, ...props }: Props) => (
  <Wrapper {...props}>
    <TutorialLink active={active} linkColor="gray" href={slug}>
      {active ? <ActiveBorder /> : null}
      {index === undefined ? title : `${index}. ${title}`}
    </TutorialLink>
    {children}
  </Wrapper>
);
