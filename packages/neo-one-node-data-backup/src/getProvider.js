/* @flow */
import type { Environment, Options } from './types';
import { GCloudProvider, MegaProvider, MultiProvider } from './provider';

export default ({
  options,
  environment,
}: {|
  options: Options,
  environment: Environment,
|}) => {
  const { gcloud, mega } = options;
  let provider;
  if (gcloud != null) {
    provider = new GCloudProvider({
      environment,
      options: gcloud,
    });
  }

  if (mega != null) {
    const megaProvider = new MegaProvider({
      environment,
      options: mega,
    });
    if (provider == null) {
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
