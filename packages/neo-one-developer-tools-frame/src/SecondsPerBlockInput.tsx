import { PrivateNetworkSettings } from '@neo-one/client-common';
import { TextInput, useStream } from '@neo-one/react-common';
import * as React from 'react';
import { defer } from 'rxjs';
import { map } from 'rxjs/operators';
import styled from 'styled-components';
import { useNetworkClients } from './DeveloperToolsContext';
import { SettingsLabel } from './SettingsLabel';
import { useAddError } from './ToastsContext';

const { useState, useCallback } = React;

const StyledTextInput = styled(TextInput)`
  width: 96px;
`;

export function SecondsPerBlockInput(props: React.ComponentProps<typeof TextInput>) {
  const [settings, setSettings] = useState<PrivateNetworkSettings>({ secondsPerBlock: 15 });
  const [editable, setEditable] = useState(true);
  const [secondsPerBlockText, setSecondsPerBlockText] = useState<string | undefined>(undefined);
  const addError = useAddError();
  const { developerClient } = useNetworkClients();
  useStream(
    () =>
      defer(async () => {
        if (developerClient !== undefined) {
          return developerClient.getSettings();
        }

        return undefined;
      }).pipe(
        map((settingsIn) => {
          if (settingsIn !== undefined) {
            setSettings(settingsIn);
          }

          return settingsIn;
        }),
      ),
    [developerClient],
  );

  const createOnChange = () => {
    if (developerClient === undefined) {
      return () => {
        // do nothing
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

    return (event: React.ChangeEvent<HTMLInputElement>) => {
      clearUpdateSecondsPerBlock();
      clearEditSecondsPerBlock();
      const secondsPerBlockTextIn = event.currentTarget.value;
      const secondsPerBlockMaybe = Number(secondsPerBlockTextIn);
      const secondsPerBlock =
        Number.isNaN(secondsPerBlockMaybe) || !Number.isInteger(secondsPerBlockMaybe)
          ? undefined
          : secondsPerBlockMaybe;
      setSecondsPerBlockText(secondsPerBlockTextIn);
      if (secondsPerBlock === undefined) {
        editSecondsPerBlockTimer = setTimeout(
          () => setSecondsPerBlockText(`${settings.secondsPerBlock}`),
          10000,
          // tslint:disable-next-line no-any
        ) as any;
      } else {
        updateSecondsPerBlockTimer = setTimeout(() => {
          setEditable(false);
          developerClient
            .updateSettings({ secondsPerBlock })
            .then(async () => {
              const nextSettings = await developerClient.getSettings();
              setSettings(nextSettings);
              setEditable(true);
            })
            .catch((error) => {
              addError(error);
              setEditable(true);
            });
          // tslint:disable-next-line no-any
        }, 2000) as any;
      }
    };
  };
  const onChange = useCallback(createOnChange, [
    developerClient,
    setEditable,
    setSecondsPerBlockText,
    addError,
    settings,
    setSettings,
  ]);

  const isEditable = editable && developerClient !== undefined;

  return (
    <SettingsLabel>
      Seconds Per Block
      <StyledTextInput
        data-test="neo-one-seconds-per-block-input"
        disabled={!isEditable}
        value={secondsPerBlockText === undefined ? settings.secondsPerBlock : secondsPerBlockText}
        onChange={onChange}
        {...props}
      />
    </SettingsLabel>
  );
}
