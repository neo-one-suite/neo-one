import { Client, DeveloperClient } from '@neo-one/client';
import { Client as OneClient } from '@neo-one/server-http-client';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import DateTimePicker from 'react-datetime-picker';
import { Button as ButtonBase, Container, Divider, Flex, Grid, Inline, Input, Label, Popover, styled } from 'reakit';
import { combineLatest, timer } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { prop } from 'styled-tools';
import { Props } from './DeveloperTools';
import { FromStream } from './FromStream';
import { Button, ThemeProvider } from './one';

// tslint:disable-next-line no-any
type ReactSyntheticEvent = React.SyntheticEvent<any>;

interface PopoverProps {
  readonly visible: boolean;
  readonly toggle: () => void;
}

interface State {
  readonly loading: boolean;
  readonly error: string | undefined;
  readonly date: Date;
  readonly secondsPerBlockText: string;
  readonly loadingSecondsPerBlock: boolean;
  readonly editingSecondsPerBlock: boolean;
}

const INITIAL_STATE: State = {
  loading: false,
  error: undefined,
  date: new Date(),
  secondsPerBlockText: '',
  loadingSecondsPerBlock: false,
  editingSecondsPerBlock: false,
};

interface EffectOptions {
  readonly state: State;
  readonly setState: (state: Partial<State>) => void;
}

const StyledButton = styled(Button)`
  bottom: 32px;
  box-shadow: 0 4px 7px rgba(0, 0, 0, 0.1);
  position: fixed;
  right: 32px;
  transform: translate(0, 0) scale(1);

  &&& {
    grid-gap: 0;
  }

  &&&:hover {
    box-shadow: 0 4px 7px rgba(0, 0, 0, 0.1);
    transform: translate(0, -2px) scale(1);
  }
`;

const StyledDivider = styled(Divider)`
  margin: 0 0.5rem;
`;

const StyledInline = styled(Inline)`
  width: 24px;
`;

const Wrapper = styled(Flex)`
  bottom: 0;
  height: 400px;
  position: fixed;
  right: 0;
  width: 400px;
  z-index: 1050;
`;

const StyledPopover = styled(Popover)`
  background-color: ${prop('theme.gray0')};
  box-shadow: 0 4px 7px rgba(0, 0, 0, 0.1);
  padding: 0;
`;

const StyledLabel = styled(Label)``;

const MenuButton = styled(ButtonBase)`
  background-color: ${prop('theme.gray0')};
  border: 0;
  width: 100%;
`;

const makeEffects = (
  client: Client,
  developerClient: DeveloperClient | undefined,
  oneClient: OneClient | undefined,
  projectID: string,
) => {
  const setLoading = (setState: EffectOptions['setState']) => {
    setState({ loading: true, error: undefined });
  };

  let currentError: Error | undefined;
  const clearError = (error: Error, setState: EffectOptions['setState']) => () => {
    if (currentError === error) {
      setState({ error: undefined });
    }
  };

  const setError = (setState: EffectOptions['setState']) => (error: Error) => {
    currentError = error;
    setState({ loading: false, error: error.message });
    setTimeout(clearError(error, setState), 5000);
  };

  const clearLoading = (setState: EffectOptions['setState']) => () => {
    setState({ loading: false });
  };

  let secondsPerBlockTimer: NodeJS.Timer | undefined;
  const doUpdateSecondsPerBlock = (secondsPerBlock: number, setState: EffectOptions['setState']) => () => {
    if (developerClient !== undefined) {
      setLoading(setState);
      setState({ loadingSecondsPerBlock: true, editingSecondsPerBlock: false });
      developerClient
        .updateSettings({ secondsPerBlock })
        .then(() => {
          clearLoading(setState)();
          setState({ loadingSecondsPerBlock: false });
        })
        .catch((error) => {
          setError(setState)(error);
          setState({ loadingSecondsPerBlock: false });
        });
    }
  };

  const updateSecondsPerBlock = (secondsPerBlock: number | undefined, setState: EffectOptions['setState']) => {
    if (secondsPerBlockTimer !== undefined) {
      clearTimeout(secondsPerBlockTimer);
      secondsPerBlockTimer = undefined;
    }

    if (secondsPerBlock !== undefined) {
      secondsPerBlockTimer = setTimeout(doUpdateSecondsPerBlock(secondsPerBlock, setState), 2000);
    }
  };

  let editSecondsPerBlockTimer: NodeJS.Timer | undefined;
  const clearEditingSecondsPerBlock = (setState: EffectOptions['setState']) => () => {
    setState({ editingSecondsPerBlock: false });
  };

  const onEditSecondsPerBlock = (setState: EffectOptions['setState']) => {
    if (editSecondsPerBlockTimer !== undefined) {
      clearTimeout(editSecondsPerBlockTimer);
      editSecondsPerBlockTimer = undefined;
    }
    editSecondsPerBlockTimer = setTimeout(clearEditingSecondsPerBlock(setState), 5000);
  };

  return {
    selectNetwork: (network: string) => ({ setState }: EffectOptions) => {
      setLoading(setState);
      client
        .selectNetwork(network)
        .then(clearLoading(setState))
        .catch(setError(setState));
    },
    runConsensus:
      developerClient === undefined
        ? undefined
        : () => ({ setState }: EffectOptions) => {
            setLoading(setState);
            developerClient
              .runConsensusNow()
              .then(clearLoading(setState))
              .catch(setError(setState));
          },
    reset:
      oneClient === undefined
        ? undefined
        : () => ({ setState }: EffectOptions) => {
            setLoading(setState);
            oneClient
              .executeTaskList({
                plugin: '@neo-one/server-plugin-project',
                options: {
                  command: 'reset',
                  projectID,
                },
              })
              .then(() => {
                clearLoading(setState)();
                client.reset();
              })
              .catch(setError(setState));
          },
    fastForwardToTime:
      developerClient === undefined
        ? undefined
        : () => ({ state: { date }, setState }: EffectOptions) => {
            setLoading(setState);
            developerClient
              .fastForwardToTime(date.valueOf())
              .then(clearLoading(setState))
              .catch(setError(setState));
          },

    setDate:
      developerClient === undefined
        ? undefined
        : (date: Date) => ({ setState }: EffectOptions) => {
            setState({ date });
          },
    setSecondsPerBlock:
      developerClient === undefined
        ? undefined
        : (secondsPerBlockText: string) => ({ setState }: EffectOptions) => {
            const secondsPerBlockMaybe = Number(secondsPerBlockText);
            const secondsPerBlock =
              Number.isNaN(secondsPerBlockMaybe) || !Number.isInteger(secondsPerBlockMaybe)
                ? undefined
                : secondsPerBlockMaybe;
            updateSecondsPerBlock(secondsPerBlock, setState);
            onEditSecondsPerBlock(setState);
            setState({ secondsPerBlockText });
          },
  };
};

const template = `
  "a a b c" 60px
  "d d d e" 60px
  "f f f f" 60px / 125px
  ""
`;

export function DeveloperToolsDev({ client, developerClients, oneClients, projectID }: Props) {
  return (
    <ThemeProvider>
      <FromStream
        props$={client.block$.pipe(
          map(({ network }) => network),
          distinctUntilChanged(),
          map((network) => {
            const developerClient = developerClients[network];
            const oneClient = oneClients[network];
            const effects = makeEffects(client, developerClient, oneClient, projectID);

            return { network, developerClient, effects };
          }),
        )}
      >
        {({ network, developerClient, effects }) => (
          <Container initialState={INITIAL_STATE} effects={effects}>
            {({
              loading,
              error,
              date,
              runConsensus,
              reset,
              selectNetwork,
              setDate,
              fastForwardToTime,
              setSecondsPerBlock,
              secondsPerBlockText,
              loadingSecondsPerBlock,
              editingSecondsPerBlock,
            }: State & ReturnType<typeof makeEffects>) => (
              <FromStream
                props$={combineLatest(
                  combineLatest(
                    client.block$.pipe(map(({ block }) => block)),
                    client.block$.pipe(
                      switchMap(async () => {
                        if (developerClient !== undefined) {
                          const settings = await developerClient.getSettings();

                          return settings.secondsPerBlock;
                        }

                        return 15;
                      }),
                    ),
                    timer(0, 500),
                  ).pipe(
                    map(([block, secondsPerBlock]) => ({
                      block,
                      secondsPerBlock,
                      timeSeconds: Math.round(Date.now() / 1000) - block.time,
                    })),
                  ),
                  client.networks$,
                )}
              >
                {([{ block, secondsPerBlock, timeSeconds }, networks]) => (
                  <Popover.Container>
                    {(popover: PopoverProps) => (
                      <Wrapper>
                        <Popover.Toggle as={StyledButton} {...popover}>
                          {network}
                          <StyledDivider vertical />
                          {new BigNumber(block.index).toFormat()}
                          <StyledDivider vertical />
                          <StyledInline>{timeSeconds}s</StyledInline>
                          <StyledPopover
                            as={Grid}
                            placement="top-end"
                            hideOnClickOutside
                            slide
                            fade
                            template={template}
                            {...popover}
                          >
                            <Grid.Item area="a">
                              <StyledLabel>
                                Network
                                <Input
                                  as="select"
                                  value={network}
                                  onChange={(event: ReactSyntheticEvent) => selectNetwork(event.currentTarget.value)}
                                >
                                  {networks.map((net) => (
                                    <option value={net}>{net}</option>
                                  ))}
                                </Input>
                              </StyledLabel>
                            </Grid.Item>
                            <Grid.Item area="b">
                              <MenuButton onClick={runConsensus} disabled={runConsensus === undefined || loading}>
                                Run Consensus
                              </MenuButton>
                            </Grid.Item>
                            <Grid.Item area="c">
                              <MenuButton onClick={reset} disabled={reset === undefined || loading}>
                                Reset
                              </MenuButton>
                            </Grid.Item>
                            <Grid.Item area="d">
                              <DateTimePicker
                                onChange={setDate}
                                value={date}
                                minDate={new Date()}
                                disabled={setDate === undefined || loading}
                              />
                            </Grid.Item>
                            <Grid.Item area="e">
                              <MenuButton onClick={fastForwardToTime} disabled={reset === undefined || loading}>
                                Fast Forward
                              </MenuButton>
                            </Grid.Item>
                            <Grid.Item area="f">
                              <StyledLabel>
                                <Input
                                  disabled={setSecondsPerBlock === undefined || loading}
                                  value={
                                    loadingSecondsPerBlock || editingSecondsPerBlock
                                      ? secondsPerBlockText
                                      : secondsPerBlock
                                  }
                                  onChange={(event: ReactSyntheticEvent) => {
                                    if (setSecondsPerBlock !== undefined) {
                                      setSecondsPerBlock(event.currentTarget.value);
                                    }
                                  }}
                                />
                                Seconds Per Block
                              </StyledLabel>
                            </Grid.Item>
                          </StyledPopover>
                          <StyledPopover placement="left" visible={!loading && error !== undefined}>
                            {error}
                          </StyledPopover>
                        </Popover.Toggle>
                      </Wrapper>
                    )}
                  </Popover.Container>
                )}
              </FromStream>
            )}
          </Container>
        )}
      </FromStream>
    </ThemeProvider>
  );
}
