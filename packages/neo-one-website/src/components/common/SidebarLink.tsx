import { Link } from '@neo-one/react-common';
import * as React from 'react';
import { Link as RouterLink } from 'react-static';
import { as, Button, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { HiddenAPI } from './types';

export interface Props {
  readonly path: string;
  readonly title: string;
  readonly hidden?: HiddenAPI;
}

const StyledLink = styled(as(RouterLink)(Link))`
  &:focus {
    color: ${prop('theme.primaryDark')};
  }
`;

const ListItem = styled(Button.as('li'))`
  margin-top: 8px;
`;

export const SidebarLink = ({ path, title, hidden, ...props }: Props) => {
  if (hidden === undefined) {
    return (
      <ListItem {...props}>
        <StyledLink linkColor="gray" to={path}>
          {title}
        </StyledLink>
      </ListItem>
    );
  }

  return (
    <Hidden.Hide as={ListItem} {...hidden} {...props}>
      <StyledLink linkColor="gray" to={path}>
        {title}
      </StyledLink>
    </Hidden.Hide>
  );
};
