import { constants as localConstants } from '@neo-one/local';

export const constants = {
  PLUGIN: '@neo-one/server-plugin-network',
  NETWORK_RESOURCE_TYPE: 'network',
  NETWORK_NAME: {
    MAIN: 'main',
    TEST: 'test',
  },
  NETWORK_URL: {
    MAIN: 'https://neotracker.io/rpc',
    TEST: 'https://testnet.neotracker.io/rpc',
  },
  DELIMITER_KEY: 'network',
  PRIVATE_NET_PRIVATE_KEY: localConstants.PRIVATE_NET_PRIVATE_KEY,
  PRIVATE_NET_PUBLIC_KEY: localConstants.PRIVATE_NET_PUBLIC_KEY,
};
