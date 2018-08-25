import { ActionMap } from 'constate';
import { formatDistanceStrict } from 'date-fns';
import * as React from 'react';
import { MdFastForward } from 'react-icons/md';
import { Container, Divider, Flex, Overlay, Paragraph, styled } from 'reakit';
import { concat, of as _of, timer } from 'rxjs';
import { catchError, distinctUntilChanged, map, skip, take } from 'rxjs/operators';
import { FromStream } from '../FromStream';
import { Button } from './Button';
import { DateTimePicker } from './DateTimePicker';
import { WithNetworkClient } from './DeveloperToolsContext';
import { Dialog } from './Dialog';
import { ToolbarButton } from './ToolbarButton';
import { WithAddError } from './WithAddError';

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

function TimeAgo({ time, ...props }: TimeAgoProps) {
  let now = Date.now();
  // tslint:disable-next-line no-any
  let lastTime: React.ReactElement<any> | undefined;
  if (time > now + 5000) {
    now = time;
    const value = new Date(time).toLocaleString();

    lastTime = (
      <>
        <StyledTime value={value} {...props}>
          {value}
        </StyledTime>
        <StyledDivider vertical />
      </>
    );
  }

  const TIMER = 100;

  return (
    <FromStream
      props$={concat(_of(0), timer(0, TIMER)).pipe(
        map((inc) => shorten(formatDistanceStrict(new Date(time), new Date(now + Math.floor(inc * TIMER))))),
        distinctUntilChanged<string>(),
      )}
    >
      {(value) => (
        <>
          {lastTime}
          <StyledTime value={value} {...props}>
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

export function BlockTime() {
  return (
    <WithAddError>
      {(addError) => (
        <WithNetworkClient>
          {({ client, developerClient }) => {
            const props$ = concat(
              _of(new Date().valueOf()),
              client.block$.pipe(
                map(({ block }) => block.time * 1000),
                distinctUntilChanged<number>(),
                catchError((error) => {
                  addError(error);

                  return _of(new Date().valueOf());
                }),
              ),
            );

            return (
              <Dialog
                title="Fast Forward"
                renderDialog={(overlay) => (
                  <FromStream
                    props$={props$.pipe(
                      skip(1),
                      take<number>(1),
                    )}
                  >
                    {(minTime) => (
                      <Container initialState={{ date: new Date(minTime) }} actions={actions}>
                        {({ date, onChangeDate }) => (
                          <>
                            <Paragraph marginTop={16} marginBottom={16}>
                              Set the next block's timestamp.
                            </Paragraph>
                            <DateTimePicker onChange={onChangeDate} initialValue={date} minDate={new Date(minTime)} />
                            <Flex justifyContent="flex-end" margin={16}>
                              <Button
                                onClick={() => {
                                  if (developerClient !== undefined) {
                                    overlay.hide();
                                    developerClient
                                      .fastForwardToTime(Math.round(date.valueOf() / 1000))
                                      .then(async () => {
                                        await developerClient.runConsensusNow();
                                      })
                                      .catch(addError);
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
                  <ToolbarButton as={Overlay.Show} help="Fast Forward..." {...overlay}>
                    <FromStream props$={props$}>{(time) => <TimeAgo time={time} />}</FromStream>
                    <MdFastForward />
                  </ToolbarButton>
                )}
              </Dialog>
            );
          }}
        </WithNetworkClient>
      )}
    </WithAddError>
  );
}
