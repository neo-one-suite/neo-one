/* @flow */
import { common, crypto } from '@neo-one/client-core';

export default [
  '422857ede524202494579a1c40e88f8c45556e51c83c3c812eff4f22ccafb79e',
  'cc820c2f669004e2755db6365a69d08f9bcd78c63653b78d26020e3ed45bece0',
  '23856dcb5a080be43deb159ce4ba2114fa147bedcfd71a47e747b236de6dff75',
  '8728b491fa268a68a9f15a4fe2037f09a6f68facc7b52251b34db8f68f065dea',
  '1045788e7f18036dc5637091fa002b6af354c060aa000976df4d89a54cb2ccd2',
  '891389165b2b17bd943c0eef2a98fe41140635adf46b09030ab6c055e0926eb2',
  '84e32b27ce9542ca5a4b37827f2c28cb099a5135eb898f30af94f0bbd8f79e89',
].map(key => {
  const privateKey = common.stringToPrivateKey(key);
  const publicKey = crypto.privateKeyToPublicKey(privateKey);
  return { privateKey, publicKey };
});
