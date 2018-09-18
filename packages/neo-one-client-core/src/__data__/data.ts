import BN from 'bn.js';

const buffers = {
  a: 'b500',
  b: '5f8d70',
};
const hash256s = {
  a: '0xb50034d97ba8c836758de1124b6c77d38bc772abc9a8f22c85e7389014e75234',
  b: '0x0621113df436c180a47b833a2814008dc4f332915b22253651593a40a342e0fb',
  c: '0x6378f79eadb05aa5ef5bca489330e059305a1180bd69021a749f63c56e37c834',
  d: '0x5f8d7c7ec5c984cb632f4d8a5c867271197dee4a09f37cbab95d799cb292cbd1',
  e: '0x669df446205866859074e6f5658479f9f25616bc682c2e5b8e28b7dfbcf6c288',
};
const bns = {
  a: new BN(1_00000000),
  b: new BN(10_00000000),
};
const signatures = {
  a:
    'b50034d97ba8c836758de1124b6c77d38bc772abc9a8f22c85e7389014e75234b50034d97ba8c836758de1124b6c77d38bc772abc9a8f22c85e7389014e75234',
};

export const data = {
  buffers,
  bns,
  hash256s,
  signatures,
};
