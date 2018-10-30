import { PrivateNetworkSettings } from '@neo-one/client-common';
import { Client, DeveloperClient } from '@neo-one/client-core';
import { FromStream, TextInput } from '@neo-one/react-common';
import { mergeScanLatest } from '@neo-one/utils';
import { EffectMap } from 'constate';
import * as React from 'react';
import { Container, styled } from 'reakit';
import { BehaviorSubject, combineLatest, concat, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WithNetworkClient } from './DeveloperToolsContext';
import { SettingsLabel } from './SettingsLabel';
import { ComponentProps, ReactSyntheticEvent } from './types';
import { AddError, WithAddError } from './WithAddError';

interface State {
  readonly secondsPerBlockText: string | undefined;
  readonly editing: boolean;
}

interface Effects {
  readonly onChange: (event: ReactSyntheticEvent) => void;
}

const StyledTextInput = styled(TextInput)`
  width: 96px;
`;

const INITIAL_STATE: State = {
  secondsPerBlockText: undefined,
  editing: false,
};

interface SecondsPerBlock {
  readonly editable: boolean;
  readonly secondsPerBlock: number;
  readonly prevSecondsPerBlock?: number;
}
const DEFAULT: SecondsPerBlock = { editable: false, secondsPerBlock: 15 };

const createProps$ = ({
  block$,
  refresh$,
  developerClient,
  addError,
}: {
  readonly block$: Client['block$'];
  readonly refresh$: Observable<PrivateNetworkSettings | undefined>;
  readonly developerClient: DeveloperClient | undefined;
  readonly addError: AddError;
}): Observable<SecondsPerBlock> =>
  concat(
    of(DEFAULT),
    combineLatest(refresh$, block$).pipe(
      // tslint:disable-next-line no-unnecessary-type-annotation
      mergeScanLatest(async (prev: SecondsPerBlock | undefined, [settingsIn]) => {
        let prevSecondsPerBlock: number | undefined;
        if (prev !== undefined) {
          prevSecondsPerBlock = prev.secondsPerBlock;
        }
        if (developerClient === undefined) {
          return DEFAULT;
        }

        if (settingsIn !== undefined) {
          return { editable: true, secondsPerBlock: settingsIn.secondsPerBlock, prevSecondsPerBlock };
        }

        const settings = await developerClient.getSettings();

        return { editable: true, secondsPerBlock: settings.secondsPerBlock, prevSecondsPerBlock };
      }),
      catchError((error) => {
        addError(error);

        return of(DEFAULT);
      }),
    ),
  );

export function SecondsPerBlockInput(props: Partial<ComponentProps<typeof TextInput>>) {
  const refresh$ = new BehaviorSubject<PrivateNetworkSettings | undefined>(undefined);

  const makeEffects = (
    addError: (error: Error) => void,
    developerClient: DeveloperClient | undefined,
  ): EffectMap<State, Effects> => {
    if (developerClient === undefined) {
      return {
        onChange: () => () => {
          // do nothing
        },
      };
    }

    let updateSecondsPerBlockTimer: number | undefined;
    const clearUpdateSecondsPerBlock = () => {
      if (updateSecondsPerBlockTimer !== undefined) {
        clearTimeout(updateSecondsPerBlockTimer);
        updateSecondsPerBlockTimer = undefined;
      }
    };

    let editSecondsPerBlockTimer: number | undefined;
    const clearEditSecondsPerBlock = () => {
      if (editSecondsPerBlockTimer !== undefined) {
        clearTimeout(editSecondsPerBlockTimer);
        editSecondsPerBlockTimer = undefined;
      }
    };

    return {
      onChange: (event) => {
        clearUpdateSecondsPerBlock();
        clearEditSecondsPerBlock();
        const secondsPerBlockText = event.currentTarget.value;

        return ({ setState }) => {
          const secondsPerBlockMaybe = Number(secondsPerBlockText);
          const secondsPerBlock =
            Number.isNaN(secondsPerBlockMaybe) || !Number.isInteger(secondsPerBlockMaybe)
              ? undefined
              : secondsPerBlockMaybe;
          setState({ editing: true, secondsPerBlockText });
          if (secondsPerBlock === undefined) {
            // tslint:disable-next-line no-any
            editSecondsPerBlockTimer = setTimeout(() => setState({ editing: false }), 10000) as any;
          } else {
            updateSecondsPerBlockTimer = setTimeout(() => {
              developerClient
                .updateSettings({ secondsPerBlock })
                .then(async () => {
                  const settings = await developerClient.getSettings();
                  refresh$.next(settings);
                  setState({ editing: false });
                })
                .catch((error) => {
                  addError(error);
                  setState({ editing: false });
                });
              // tslint:disable-next-line no-any
            }, 2000) as any;
          }
        };
      },
    };
  };

  return (
    <WithAddError>
      {(addError) => (
        <WithNetworkClient>
          {({ block$, developerClient }) => (
            <Container initialState={INITIAL_STATE} effects={makeEffects(addError, developerClient)}>
              {({ secondsPerBlockText, editing, onChange }) => (
                <FromStream
                  props={[block$, addError, developerClient, refresh$]}
                  createStream={() => createProps$({ block$, addError, developerClient, refresh$ })}
                >
                  {({ editable, secondsPerBlock, prevSecondsPerBlock }) => (
                    <SettingsLabel>
                      Seconds Per Block
                      <StyledTextInput
                        data-test="neo-one-seconds-per-block-input"
                        disabled={!editable || developerClient === undefined}
                        value={
                          secondsPerBlockText === undefined ||
                          !editing ||
                          (prevSecondsPerBlock !== undefined && secondsPerBlock !== prevSecondsPerBlock)
                            ? `${secondsPerBlock}`
                            : secondsPerBlockText
                        }
                        onChange={onChange}
                        {...props}
                      />
                    </SettingsLabel>
                  )}
                </FromStream>
              )}
            </Container>
          )}
        </WithNetworkClient>
      )}
    </WithAddError>
  );
}
