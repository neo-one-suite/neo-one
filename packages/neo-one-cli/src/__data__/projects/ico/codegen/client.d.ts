/* @hash 0d5452fccc939ba6c3b90e9cd90caa07 */
// tslint:disable
/* eslint-disable */
import {
  DeveloperClients,
  LocalKeyStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  UserAccountProviders,
} from '@neo-one/client';

export interface DefaultUserAccountProviders {
  readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>;
}

export const createClient: <TUserAccountProviders extends UserAccountProviders<any> = DefaultUserAccountProviders>(
  getUserAccountProvidersOrHost?: string | ((provider: NEOONEProvider) => TUserAccountProviders),
) => Client<
  TUserAccountProviders extends UserAccountProviders<infer TUserAccountProvider> ? TUserAccountProvider : never,
  TUserAccountProviders
>;

export const createDeveloperClients: (host?: string) => DeveloperClients;
