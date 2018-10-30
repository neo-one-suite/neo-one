import { Client } from '@neo-one/client-core';
import { Button, FromStream } from '@neo-one/react-common';
import { ActionMap } from 'constate';
import { formatDistanceStrict } from 'date-fns';
import * as React from 'react';
import { MdFastForward } from 'react-icons/md';
import { Container, Divider, Flex, Overlay, Paragraph, styled } from 'reakit';
import { concat, of as _of, timer } from 'rxjs';
import { catchError, distinctUntilChanged, map, skip, take } from 'rxjs/operators';
import { DateTimePicker } from './DateTimePicker';
import { WithNetworkClient } from './DeveloperToolsContext';
import { Dialog } from './Dialog';
import { ToolbarButton } from './ToolbarButton';
import { AddError, WithAddError } from './WithAddError';

const StyledTime = styled('time')`
  min-width: ${({ value }: { readonly value: string }) => Math.max(30, value.length * 8)}px;
`;

const StyledDivider = styled(Divider)`
  height: 22px;
  margin: 0 8px;
`;

interface TimeAgoProps {
  readonly time: number;
}

const SHORTEN_PAIRS: ReadonlyArray<[string, string]> = [
  [' seconds', 's'],
  [' second', 's'],
  [' minutes', 'm'],
  [' minute', 'm'],
  [' hours', 'h'],
  [' hour', 'h'],
  [' days', 'D'],
  [' day', 'D'],
  [' months', 'M'],
  [' month', 'M'],
  [' years', 'Y'],
  [' year', 'Y'],
];

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
  // tslint:disable-next-line no-any
  let lastTime: React.ReactElement<any> | undefined;
  if (time > now + 5000) {
    now = time;
    const value = new Date(time).toLocaleString();

    lastTime = (
      <>
        <StyledTime data-test="neo-one-block-time-last-time-value" value={value} {...props}>
          {value}
        </StyledTime>
        <StyledDivider vertical />
      </>
    );
  }

  return (
    <FromStream
      props={[now, time]}
      createStream={() =>
        concat(_of(0), timer(0, TIMER)).pipe(
          map((inc) => shorten(formatDistanceStrict(new Date(time), new Date(now + Math.floor(inc * TIMER))))),
          distinctUntilChanged<string>(),
        )
      }
    >
      {(value: string) => (
        <>
          {lastTime}
          <StyledTime data-test="neo-one-block-time-time-value" value={value} {...props}>
            {value}
          </StyledTime>
        </>
      )}
    </FromStream>
  );
}

// tslint:disable-next-line no-any
interface State {
  readonly date: Date;
}
interface Actions {
  readonly onChangeDate: (date: Date) => void;
}

const actions: ActionMap<State, Actions> = {
  onChangeDate: (date) => () => ({ date }),
};

interface TimeOptions {
  readonly addError: AddError;
  readonly block$: Client['block$'];
}

const createTime$ = ({ addError, block$ }: TimeOptions) =>
  concat(
    _of(new Date().valueOf()),
    block$.pipe(
      map(({ block }) => block.time * 1000),
      distinctUntilChanged<number>(),
      catchError((error) => {
        addError(error);

        return _of(new Date().valueOf());
      }),
    ),
  );

const createMinTime$ = (options: TimeOptions) =>
  createTime$(options).pipe(
    skip(1),
    take<number>(1),
  );

export function BlockTime() {
  return (
    <WithAddError>
      {(addError) => (
        <WithNetworkClient>
          {({ block$, developerClient }) => (
            <Dialog
              data-test-heading="neo-one-block-time-dialog-heading"
              data-test-close-button="neo-one-block-time-dialog-close-button"
              title="Fast Forward"
              renderDialog={(overlay) => (
                <FromStream props={[block$, addError]} createStream={() => createMinTime$({ block$, addError })}>
                  {(minTime) => (
                    <Container initialState={{ date: new Date(minTime) }} actions={actions}>
                      {({ date, onChangeDate }) => (
                        <>
                          <Paragraph data-test="neo-one-block-time-dialog-text" marginTop={16} marginBottom={16}>
                            Set the next block's timestamp.
                          </Paragraph>
                          <DateTimePicker
                            data-test-input="neo-one-block-time-dialog-date-time-picker-input"
                            data-test-error="neo-one-block-time-dialog-date-time-picker-error"
                            onChange={onChangeDate}
                            initialValue={date}
                            minDate={new Date(minTime)}
                          />
                          <Flex justifyContent="flex-end" margin={16}>
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
                          </Flex>
                        </>
                      )}
                    </Container>
                  )}
                </FromStream>
              )}
            >
              {(overlay) => (
                <ToolbarButton
                  data-test-button="neo-one-block-time-button"
                  data-test-tooltip="neo-one-block-time-tooltip"
                  as={Overlay.Show}
                  help="Fast Forward..."
                  {...overlay}
                >
                  <FromStream props={[block$, addError]} createStream={() => createTime$({ block$, addError })}>
                    {(time) => <TimeAgo time={time} />}
                  </FromStream>
                  <MdFastForward />
                </ToolbarButton>
              )}
            </Dialog>
          )}
        </WithNetworkClient>
      )}
    </WithAddError>
  );
}
