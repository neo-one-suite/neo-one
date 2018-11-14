import { pure, Tooltip, TooltipArrow } from '@neo-one/react-common';
import * as React from 'react';
import { as, Block, Box, Grid, styled } from 'reakit';
import { prop, switchProp } from 'styled-tools';
import { RouterLink } from '../../RouterLink';

interface Item {
  readonly complete: boolean;
  readonly title: string;
  readonly to: string;
}

interface Props {
  readonly current?: number;
  readonly items: ReadonlyArray<Item>;
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

const Segment = as(RouterLink)(SegmentBase);

const StyledTooltip = styled(Tooltip)`
  white-space: nowrap;
`;

interface ProgressItemProps {
  readonly idx: number;
  readonly isCurrent: boolean;
  readonly items: ReadonlyArray<Item>;
  readonly item: Item;
}

const ProgressItemTooltip = pure(({ title }: { readonly title: string }) => (
  <StyledTooltip placement="bottom">
    <TooltipArrow />
    {title}
  </StyledTooltip>
));

const ProgressItem = pure(({ idx, items, item, isCurrent }: ProgressItemProps) => (
  <Block relative>
    {isCurrent || item.complete || idx === 0 || items[idx - 1].complete ? (
      <Segment to={item.to} key={idx} bg={isCurrent ? 'current' : item.complete ? 'complete' : 'incomplete'} />
    ) : (
      <SegmentBase key={idx} bg="incomplete" />
    )}
    <ProgressItemTooltip title={item.title} />
  </Block>
));

export const ProgressBar = ({ current, items }: Props) => (
  <Grid column gap={4} height="8px">
    {items.map((item, idx) => (
      <ProgressItem key={idx} idx={idx} item={item} isCurrent={idx === current} items={items} />
    ))}
  </Grid>
);
