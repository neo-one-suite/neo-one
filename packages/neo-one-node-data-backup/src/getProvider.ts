import { GCloudProvider, MegaProvider, MultiProvider } from './provider';
import { Environment, Options } from './types';

export const getProvider = ({
  options,
  environment,
}: {
  readonly options: Options;
  readonly environment: Environment;
}) => {
  const { gcloud, mega } = options;
  let provider;
  if (gcloud !== undefined) {
    provider = new GCloudProvider({
      environment,
      options: gcloud,
    });
  }

  if (mega !== undefined) {
    const megaProvider = new MegaProvider({
      environment,
      options: mega,
    });

    if (provider === undefined) {
      provider = megaProvider;
    } else {
      provider = new MultiProvider({
        providers: [provider, megaProvider],
        environment,
      });
    }
  }

  return provider;
};
