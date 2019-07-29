import styled from '@emotion/styled';
import { Box, TextInput } from '@neo-one/react-common';
import * as React from 'react';
import { ReferenceLink } from './ReferenceLink';
import { TypeFilter } from './TypeFilter';
import { ReferenceItem } from './types';

const { useState } = React;

const ReferenceLayout = styled(Box)`
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(auto-fill, 400px);
  grid-gap: 8px;
`;

const Wrapper = styled(Box)`
  display: grid;
  gap: 16px;
  min-width: 0;
`;

const StyledInput = styled(TextInput)`
  width: 144px;
`;

const FilterWrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  justify-content: start;
  align-content: center;
  gap: 16px;
`;

interface Props {
  readonly content: readonly ReferenceItem[];
}

export const ReferenceGrid = ({ content, ...props }: Props) => {
  const [typeFilter, setTypeFilter] = useState('All');
  const [textFilter, setTextFilter] = useState('');

  return (
    <Wrapper {...props}>
      <FilterWrapper>
        <TypeFilter selected={typeFilter} onChange={setTypeFilter} />
        <StyledInput
          placeholder="Filter"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTextFilter(event.target.value)}
        />
      </FilterWrapper>
      <ReferenceLayout>
        {content
          .filter(
            (reference) =>
              (typeFilter === 'All' ? true : typeFilter.toLowerCase() === reference.type.toLowerCase()) &&
              (textFilter === '' ? true : reference.name.toLowerCase().includes(textFilter.toLowerCase())),
          )
          .map(({ name, type, slug }) => (
            <ReferenceLink title={name} type={type} path={slug} key={slug} />
          ))}
      </ReferenceLayout>
    </Wrapper>
  );
};
