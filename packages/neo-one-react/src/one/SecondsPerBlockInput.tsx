import { DeveloperClient, PrivateNetworkSettings } from '@neo-one/client';
import { EffectMap } from 'constate';
import * as React from 'react';
import { Container, styled } from 'reakit';
import { BehaviorSubject, combineLatest, concat, of, of as _of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { prop } from 'styled-tools';
import { FromStream } from '../FromStream';
import { ComponentProps, ReactSyntheticEvent } from '../types';
import { WithNetworkClient } from './DeveloperToolsContext';
import { TextInput } from './TextInput';
import { Tooltip, TooltipArrow } from './Tooltip';
import { WithAddError } from './WithAddError';

interface State {
  readonly secondsPerBlockText: string | undefined;
  readonly editing: boolean;
}

interface Effects {
  readonly onChange: (event: ReactSyntheticEvent) => void;
}

const StyledTextInput = styled(TextInput)`
  background-color: ${prop('theme.gray0')};
  border-radius: 0;
  border-right: 0;
  height: 40px;
  padding: 0 8px;
  width: 40px;
`;

const INITIAL_STATE: State = {
  secondsPerBlockText: undefined,
  editing: false,
};

const DEFAULT = { editable: false, secondsPerBlock: 15 };

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

    let updateSecondsPerBlockTimer: NodeJS.Timer | undefined;
    const clearUpdateSecondsPerBlock = () => {
      if (updateSecondsPerBlockTimer !== undefined) {
        clearTimeout(updateSecondsPerBlockTimer);
        updateSecondsPerBlockTimer = undefined;
      }
    };

    let editSecondsPerBlockTimer: NodeJS.Timer | undefined;
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
            editSecondsPerBlockTimer = setTimeout(() => setState({ editing: false }), 10000);
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
            }, 2000);
          }
        };
      },
    };
  };

  return (
    <WithAddError>
      {(addError) => (
        <WithNetworkClient>
          {({ client, developerClient }) => {
            const props$ = concat(
              _of(DEFAULT),
              combineLatest(refresh$, client.block$).pipe(
                switchMap(async ([settingsIn]) => {
                  if (developerClient === undefined) {
                    return DEFAULT;
                  }

                  if (settingsIn !== undefined) {
                    return { editable: true, secondsPerBlock: settingsIn.secondsPerBlock };
                  }

                  const settings = await developerClient.getSettings();

                  return { editable: true, secondsPerBlock: settings.secondsPerBlock };
                }),
                catchError((error) => {
                  addError(error);

                  return of(DEFAULT);
                }),
              ),
            );

            return (
              <Container initialState={INITIAL_STATE} effects={makeEffects(addError, developerClient)}>
                {({ secondsPerBlockText, editing, onChange }) => (
                  <FromStream props$={props$}>
                    {({ editable, secondsPerBlock }) => (
                      <div>
                        <StyledTextInput
                          disabled={!editable || developerClient === undefined}
                          value={
                            secondsPerBlockText === undefined || !editing ? `${secondsPerBlock}` : secondsPerBlockText
                          }
                          onChange={onChange}
                          {...props}
                        />
                        <Tooltip placement="top">
                          <TooltipArrow />
                          Seconds Per Block
                        </Tooltip>
                      </div>
                    )}
                  </FromStream>
                )}
              </Container>
            );
          }}
        </WithNetworkClient>
      )}
    </WithAddError>
  );
}
