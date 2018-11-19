import { useStream } from '@neo-one/react-common';
import { defer } from 'rxjs';
import { useNetworkClients } from './DeveloperToolsContext';

export const useNEOTrackerURL = () => {
  const { localClient } = useNetworkClients();

  return useStream(
    () =>
      defer(async () => {
        if (localClient === undefined) {
          return 'https://neotracker.io';
        }

        return localClient.getNEOTrackerURL();
      }),
    [localClient],
    'https://neotracker.io',
  );
};
