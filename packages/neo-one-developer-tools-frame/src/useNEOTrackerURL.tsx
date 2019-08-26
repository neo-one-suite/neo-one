import { useStream } from '@neo-one/react-common';
import { defer } from 'rxjs';
import { useNetworkClients } from './DeveloperToolsContext';

export const useNEOTrackerURL = () => {
  const { developerClient } = useNetworkClients();

  return useStream(
    () =>
      defer(async () => {
        if (developerClient === undefined) {
          return 'https://neotracker.io';
        }

        return developerClient.getNEOTrackerURL();
      }),
    [developerClient],
    'https://neotracker.io',
  );
};
