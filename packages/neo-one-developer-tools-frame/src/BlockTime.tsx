import styled from '@emotion/styled';
import { Client } from '@neo-one/client-core';
import { Box, Button, Divider, Paragraph, useStream } from '@neo-one/react-common';
// tslint:disable-next-line: no-submodule-imports
import formatDistanceStrict from 'date-fns/formatDistanceStrict';
import * as React from 'react';
import { MdFastForward } from 'react-icons/md';
import { concat, of as _of, timer } from 'rxjs';
import { catchError, distinctUntilChanged, map, skip, take } from 'rxjs/operators';
import { prop } from 'styled-tools';
import { DateTimePicker } from './DateTimePicker';
import { useNetworkClients } from './DeveloperToolsContext';
import { Dialog } from './Dialog';
import { AddError, useAddError } from './ToastsContext';
import { ToolbarButton } from './ToolbarButton';

const { useState } = React;

const Time = Box.withComponent('time');
const StyledTime = styled<typeof Time, { readonly minWidth: number }>(Time)`
  min-width: ${prop('minWidth')}px;
`;
const getMinWidth = (value: string) => Math.max(30, value.length * 8);

const StyledDivider = styled(Divider)`
  height: 22px;
  margin: 0 8px;
`;

const StyledParagraph = styled(Paragraph)`
  margin-top: 16;
  margin-bottom: 16;
`;

const ButtonWrapper = styled(Box)`
  display: flex;
  justify-content: flex-end;
  margin: 16;
`;

interface TimeAgoProps {
  readonly time: number;
}

const SHORTEN_PAIRS = [
  [' seconds', 's'] as const,
  [' second', 's'] as const,
  [' minutes', 'm'] as const,
  [' minute', 'm'] as const,
  [' hours', 'h'] as const,
  [' hour', 'h'] as const,
  [' days', 'D'] as const,
  [' day', 'D'] as const,
  [' months', 'M'] as const,
  [' month', 'M'] as const,
  [' years', 'Y'] as const,
  [' year', 'Y'] as const,
] as const;

const shorten = (value: string) => {
  // tslint:disable-next-line no-loop-statement
  for (const [suffix, replace] of SHORTEN_PAIRS) {
    if (value.endsWith(suffix)) {
      return `${value.slice(0, -suffix.length)}${replace}`;
    }
  }

  return value;
};

const TIMER = 100;

function TimeAgo({ time, ...props }: TimeAgoProps) {
  let now = Date.now();
  let lastTime: React.ReactElement | undefined;
  if (time > now + 5000) {
    now = time;
    const innerValue = new Date(time).toLocaleString();

    lastTime = (
      <>
        <StyledTime data-test="neo-one-block-time-last-time-value" minWidth={getMinWidth(innerValue)} {...props}>
          {innerValue}
        </StyledTime>
        <StyledDivider vertical />
      </>
    );
  }

  const value = useStream(
    () =>
      concat(_of(0), timer(0, TIMER)).pipe(
        map((inc) => shorten(formatDistanceStrict(new Date(time), new Date(now + Math.floor(inc * TIMER))))),
        distinctUntilChanged<string>(),
      ),
    [now, time],
  );

  return (
    <>
      {lastTime}
      <StyledTime data-test="neo-one-block-time-time-value" minWidth={getMinWidth(value)} {...props}>
        {value}
      </StyledTime>
    </>
  );
}

interface TimeOptions {
  readonly addError: AddError;
  readonly block$: Client['block$'];
}

const createTime$ = ({ addError, block$ }: TimeOptions) =>
  concat(
    _of(Date.now()),
    block$.pipe(
      map(({ block }) => block.time * 1000),
      distinctUntilChanged<number>(),
      catchError((error) => {
        addError(error);

        return _of(Date.now());
      }),
    ),
  );

const createMinTime$ = (options: TimeOptions) => createTime$(options).pipe(skip(1), take<number>(1));

export function BlockTime() {
  const addError = useAddError();
  const { block$, developerClient } = useNetworkClients();
  const time = useStream(() => createTime$({ block$, addError }), [block$, addError]);
  const minTime = useStream(() => createMinTime$({ block$, addError }), [block$, addError], time);
  const [date, setDate] = useState(new Date(minTime));

  return (
    <Dialog
      data-test-heading="neo-one-block-time-dialog-heading"
      data-test-close-button="neo-one-block-time-dialog-close-button"
      title="Fast Forward"
      renderDialog={(overlay) => (
        <>
          <StyledParagraph data-test="neo-one-block-time-dialog-text">Set the next block's timestamp.</StyledParagraph>
          <DateTimePicker
            data-test-input="neo-one-block-time-dialog-date-time-picker-input"
            data-test-error="neo-one-block-time-dialog-date-time-picker-error"
            onChange={setDate}
            initialValue={date}
            minDate={new Date(minTime)}
          />
          <ButtonWrapper>
            <Button
              data-test="neo-one-block-time-dialog-button"
              onClick={() => {
                if (developerClient !== undefined) {
                  overlay.hide();
                  developerClient.fastForwardToTime(Math.round(date.valueOf() / 1000)).catch(addError);
                }
              }}
            >
              Fast Forward
            </Button>
          </ButtonWrapper>
        </>
      )}
    >
      {(overlay) => (
        <ToolbarButton
          data-test-button="neo-one-block-time-button"
          data-test-tooltip="neo-one-block-time-tooltip"
          help="Fast Forward..."
          onClick={overlay.show}
        >
          <TimeAgo time={time} />
          <MdFastForward />
        </ToolbarButton>
      )}
    </Dialog>
  );
}
