import { Box, Link } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { Author } from './types';

const Text = styled(Box)`
  ${prop('theme.fonts.axiformaRegular')}
  ${prop('theme.fontStyles.subheading')}
  color: ${prop('theme.black')};
`;

const StyledLink = styled(Link)`
  ${prop('theme.fonts.axiformaRegular')}
  ${prop('theme.fontStyles.subheading')}
`;

interface Props {
  readonly author: Author;
  readonly date: string;
}

export const DateAndAuthor = ({ author, date, ...props }: Props) => {
  const [year, month, day] = date.split('-');
  const dateValue = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));

  return (
    <Text {...props}>
      {dateValue.toLocaleDateString()} by{' '}
      <StyledLink linkColor="accent" href={author.twitter} target="_blank">
        {author.name}
      </StyledLink>
    </Text>
  );
};
