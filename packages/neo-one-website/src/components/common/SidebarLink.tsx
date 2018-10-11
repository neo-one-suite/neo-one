import { Link } from '@neo-one/react-common';
import * as React from 'react';
import { Link as RouterLink } from 'react-static';
import { as, Box, Hidden, styled } from 'reakit';
import { HiddenAPI } from './types';

export interface Props {
  readonly path: string;
  readonly title: string;
  readonly hidden?: HiddenAPI;
}

const SectionLink = as(RouterLink)(Link);

const ListItem = styled(Box.as('li'))`
  margin-top: 8px;
`;

export const SidebarLink = ({ path, title, hidden, ...props }: Props) => {
  if (hidden === undefined) {
    return (
      <ListItem {...props}>
        <SectionLink linkColor="gray" to={path}>
          {title}
        </SectionLink>
      </ListItem>
    );
  }

  return (
    <Hidden.Hide as={ListItem} {...hidden} {...props}>
      <SectionLink linkColor="gray" to={path}>
        {title}
      </SectionLink>
    </Hidden.Hide>
  );
};
