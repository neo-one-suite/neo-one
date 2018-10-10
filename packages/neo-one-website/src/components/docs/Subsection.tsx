import * as React from 'react';
import { Link as RouterLink } from 'react-static';
import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';

export interface Props {
  readonly slug: string;
  readonly title: string;
  readonly onClick?: () => void;
}

const NavigationLink = styled(RouterLink)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
  color: ${prop('theme.black')};
  text-decoration: none;

  &:hover {
    color: ${prop('theme.accent')};
  }

  &:focus {
    ${prop('theme.fonts.axiformaBold')};
  }
`;

const ListItem = styled(Box.as('li'))`
  margin-top: 8px;
`;

export const Subsection = ({ slug, title, onClick, ...props }: Props) => {
  const path = `/docs/${slug}`;

  return (
    <ListItem {...props}>
      <NavigationLink to={path} onClick={onClick}>
        {title}
      </NavigationLink>
    </ListItem>
  );
};
