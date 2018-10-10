import * as React from 'react';
import { Link as RouterLink } from 'react-static';
import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';

export interface Props {
  readonly title: string;
  readonly onClick?: () => void;
}

const slugify = (title: string) => title.toLowerCase().replace(' ', '-');

const NavigationLink = styled(RouterLink)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
  color: ${prop('theme.black')};
  text-decoration: none;

  &:hover {
    color: ${prop('theme.accent')};
  }

  &:active {
    ${prop('theme.fonts.axiformaBold')};
  }

  &:focus {
    ${prop('theme.fonts.axiformaBold')};
  }
`;

const ListItem = styled(Box.as('li'))`
  margin-top: 8px;
`;

export const SectionTitleLink = ({ title, onClick, ...props }: Props) => {
  const path = `#${slugify(title)}`;

  return (
    <ListItem {...props}>
      <NavigationLink to={path} onClick={onClick}>
        {title}
      </NavigationLink>
    </ListItem>
  );
};
