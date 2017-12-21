/* @flow */
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { type Network as ClientNetwork, networks } from '@neo-one/client';

// eslint-disable-next-line
export const getClientNetwork = (networkName: string): ClientNetwork => {
  if (networkName === networkConstants.NETWORK_NAME.MAIN) {
    return networks.MAIN;
  } else if (networkName === networkConstants.NETWORK_NAME.TEST) {
    return networks.TEST;
  }

  return {
    type: networkName,
    addressVersion: networks.MAIN.addressVersion,
    privateKeyVersion: networks.MAIN.privateKeyVersion,
    issueGASFee: networks.MAIN.issueGASFee,
  };
};
