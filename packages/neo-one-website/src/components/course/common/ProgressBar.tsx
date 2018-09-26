import { Tooltip, TooltipArrow } from '@neo-one/react';
import * as React from 'react';
import { Link } from 'react-static';
import { as, Block, Box, Grid, styled } from 'reakit';
import { ifProp, prop } from 'styled-tools';

interface Props {
  readonly current?: number;
  readonly items: ReadonlyArray<{
    readonly complete: boolean;
    readonly title: string;
    readonly to: string;
  }>;
}

const Segment = styled(as(Link)(Box))<{ readonly primary: boolean }>`
  background-color: ${ifProp('primary', prop('theme.primary'), prop('theme.accent'))};
  height: 100%;
  display: block;
`;

export const ProgressBar = ({ current, items }: Props) => (
  <Grid column gap={4} height="8px">
    {items.map((item, idx) => (
      <Block key={idx} relative>
        <Segment to={item.to} key={idx} primary={idx === current || item.complete} />
        <Tooltip placement="bottom">
          <TooltipArrow />
          {item.title}
        </Tooltip>
      </Block>
    ))}
  </Grid>
);
