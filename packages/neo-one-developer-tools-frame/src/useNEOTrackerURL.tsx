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

        const configuration = await developerClient.getProjectConfiguration();

        return configuration === undefined ? undefined : `http://localhost:${configuration.neotracker.port}`;
      }),
    [developerClient],
    'https://neotracker.io',
  );
};
