import styled from '@emotion/styled';
import { Box, Tooltip, TooltipArrow } from '@neo-one/react-common';
import * as React from 'react';
import { prop, switchProp } from 'styled-tools';
import { RouterLink } from '../../RouterLink';

interface Item {
  readonly complete: boolean;
  readonly title: string;
  readonly to: string;
}

interface Props {
  readonly current?: number;
  readonly items: readonly Item[];
}

const SegmentBase = styled(Box)<{ readonly bg: 'current' | 'complete' | 'incomplete' }>`
  /* stylelint-disable-next-line */
  background-color: ${switchProp('bg', {
    current: prop('theme.primaryDark'),
    complete: prop('theme.primary'),
    incomplete: prop('theme.accent'),
  })};
  height: 100%;
  display: block;
`;

const Segment = SegmentBase.withComponent(RouterLink);

const RelativeBlock = styled(Box)`
  display: block;
  position: relative;
`;

const StyledTooltip = styled(Tooltip)`
  white-space: nowrap;
`;

const Wrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  gap: 4px;
  height: 8px;
`;

interface ProgressItemProps {
  readonly idx: number;
  readonly isCurrent: boolean;
  readonly items: readonly Item[];
  readonly item: Item;
}

const ProgressItemTooltip = React.memo(({ title }: { readonly title: string }) => (
  <StyledTooltip placement="bottom">
    <TooltipArrow />
    {title}
  </StyledTooltip>
));

const ProgressItem = React.memo(({ idx, items, item, isCurrent }: ProgressItemProps) => (
  <RelativeBlock>
    {isCurrent || item.complete || idx === 0 || items[idx - 1].complete ? (
      <Segment to={item.to} key={idx} bg={isCurrent ? 'current' : item.complete ? 'complete' : 'incomplete'} />
    ) : (
      <SegmentBase key={idx} bg="incomplete" />
    )}
    <ProgressItemTooltip title={item.title} />
  </RelativeBlock>
));

export const ProgressBar = ({ current, items }: Props) => (
  <Wrapper>
    {items.map((item, idx) => (
      <ProgressItem key={idx} idx={idx} item={item} isCurrent={idx === current} items={items} />
    ))}
  </Wrapper>
);
