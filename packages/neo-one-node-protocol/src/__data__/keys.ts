import { common, ECPoint, PrivateKey } from '@neo-one/client-core';

export const keys: ReadonlyArray<{ privateKey: PrivateKey; publicKey: ECPoint }> = [
  [
    '422857ede524202494579a1c40e88f8c45556e51c83c3c812eff4f22ccafb79e',
    '02f5964316af89193ec970b784ad6f50c166cf96559aaa8cef2bbe20efad358f5d',
  ],
  [
    'cc820c2f669004e2755db6365a69d08f9bcd78c63653b78d26020e3ed45bece0',
    '031e19523fbd4a1d4bbba2a0b9b29b62123a34533bbf6a0b935cc9a2f5b50d1d24',
  ],
  [
    '23856dcb5a080be43deb159ce4ba2114fa147bedcfd71a47e747b236de6dff75',
    '03d6c46bd7788fcae813142ef88395a7e043758749cff435c65130a916fc8ed535',
  ],
  [
    '8728b491fa268a68a9f15a4fe2037f09a6f68facc7b52251b34db8f68f065dea',
    '03a01c70439a3ef4ab4daa29f02705c66a04b7c75aebaf4d276c5df26b0e29eeb4',
  ],
  [
    '1045788e7f18036dc5637091fa002b6af354c060aa000976df4d89a54cb2ccd2',
    '03b20ec206d81ab1fc68c7543dc4a3fa4869bbb62954d73b5d8b914e2cec5ee005',
  ],
  [
    '891389165b2b17bd943c0eef2a98fe41140635adf46b09030ab6c055e0926eb2',
    '03d62cf07c9dc8b346af37879030ea216ae8a6213b9d4ff9ad63d626f8dd726349',
  ],
  [
    '84e32b27ce9542ca5a4b37827f2c28cb099a5135eb898f30af94f0bbd8f79e89',
    '02ce4e41167be3258229aa9a39b9461f6a1a3e46945154be8e8eb7543053c2a406',
  ],
].map(([privateKey, publicKey]) => ({
  privateKey: common.stringToPrivateKey(privateKey),
  publicKey: common.stringToECPoint(publicKey),
}));
