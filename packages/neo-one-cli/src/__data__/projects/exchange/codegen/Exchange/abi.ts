/* @hash 587b6e8299d7ecce1d9df13cd272ced5 */
// tslint:disable
/* eslint-disable */
import { ABI } from '@neo-one/client';

export const exchangeABI: ABI = {
  events: [
    {
      name: 'deposited',
      parameters: [
        {
          forwardedValue: false,
          name: 'address',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'assetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'amount',
          optional: false,
          type: 'Integer',
        },
      ],
    },
    {
      name: 'withdrawn',
      parameters: [
        {
          forwardedValue: false,
          name: 'address',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'assetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'amount',
          optional: false,
          type: 'Integer',
        },
      ],
    },
    {
      name: 'offerCreated',
      parameters: [
        {
          forwardedValue: false,
          name: 'makerAddress',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'offerAssetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'offerAmount',
          optional: false,
          type: 'Integer',
        },
        {
          forwardedValue: false,
          name: 'wantAssetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'wantAmount',
          optional: false,
          type: 'Integer',
        },
        {
          forwardedValue: false,
          name: 'offerHash',
          optional: false,
          type: 'Hash256',
        },
      ],
    },
    {
      name: 'offerCancelled',
      parameters: [
        {
          forwardedValue: false,
          name: 'offerHash',
          optional: false,
          type: 'Hash256',
        },
      ],
    },
    {
      name: 'burnt',
      parameters: [
        {
          forwardedValue: false,
          name: 'filler',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'takerFeeAssetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'takerFeeAmount',
          optional: false,
          type: 'Integer',
        },
      ],
    },
    {
      name: 'offerFilled',
      parameters: [
        {
          forwardedValue: false,
          name: 'filler',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'offerHash',
          optional: false,
          type: 'Hash256',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'amountToFill',
          optional: false,
          type: 'Integer',
        },
        {
          forwardedValue: false,
          name: 'offerAssetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'offerAmount',
          optional: false,
          type: 'Integer',
        },
        {
          forwardedValue: false,
          name: 'wantAssetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'wantAmount',
          optional: false,
          type: 'Integer',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'amountToTake',
          optional: false,
          type: 'Integer',
        },
      ],
    },
  ],
  functions: [
    {
      constant: true,
      name: 'owner',
      parameters: [],
      returnType: {
        forwardedValue: false,
        optional: false,
        type: 'Address',
      },
    },
    {
      claim: false,
      constant: true,
      name: 'balanceOf',
      parameters: [
        {
          forwardedValue: false,
          name: 'address',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'assetID',
          optional: false,
          type: 'Address',
        },
      ],
      receive: false,
      returnType: {
        decimals: 8,
        forwardedValue: false,
        optional: false,
        type: 'Integer',
      },
      send: false,
      sendUnsafe: false,
    },
    {
      claim: false,
      constant: true,
      name: 'getOffer',
      parameters: [
        {
          forwardedValue: false,
          name: 'offerHash',
          optional: false,
          type: 'Hash256',
        },
      ],
      receive: false,
      returnType: {
        forwardedValue: false,
        optional: true,
        properties: {
          maker: {
            forwardedValue: false,
            optional: false,
            type: 'Address',
          },
          makerFeeAssetID: {
            forwardedValue: false,
            optional: false,
            type: 'Address',
          },
          makerFeeAvailableAmount: {
            decimals: 8,
            forwardedValue: false,
            optional: false,
            type: 'Integer',
          },
          nonce: {
            forwardedValue: false,
            optional: false,
            type: 'String',
          },
          offerAmount: {
            decimals: 8,
            forwardedValue: false,
            optional: false,
            type: 'Integer',
          },
          offerAssetID: {
            forwardedValue: false,
            optional: false,
            type: 'Address',
          },
          wantAmount: {
            decimals: 8,
            forwardedValue: false,
            optional: false,
            type: 'Integer',
          },
          wantAssetID: {
            forwardedValue: false,
            optional: false,
            type: 'Address',
          },
        },
        type: 'Object',
      },
      send: false,
      sendUnsafe: false,
    },
    {
      claim: false,
      constant: false,
      name: 'depositNEP17',
      parameters: [
        {
          forwardedValue: false,
          name: 'from',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'assetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'amount',
          optional: false,
          type: 'Integer',
        },
      ],
      receive: false,
      returnType: {
        optional: false,
        type: 'Void',
      },
      send: false,
      sendUnsafe: false,
    },
    {
      claim: false,
      constant: false,
      name: 'withdrawNEP17',
      parameters: [
        {
          forwardedValue: false,
          name: 'from',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'assetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'amount',
          optional: false,
          type: 'Integer',
        },
      ],
      receive: false,
      returnType: {
        optional: false,
        type: 'Void',
      },
      send: false,
      sendUnsafe: false,
    },
    {
      claim: false,
      constant: false,
      name: 'makeOffer',
      parameters: [
        {
          forwardedValue: false,
          name: 'maker',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'offerAssetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'offerAmount',
          optional: false,
          type: 'Integer',
        },
        {
          forwardedValue: false,
          name: 'wantAssetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'wantAmount',
          optional: false,
          type: 'Integer',
        },
        {
          forwardedValue: false,
          name: 'makerFeeAssetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'makerFeeAvailableAmount',
          optional: false,
          type: 'Integer',
        },
        {
          forwardedValue: false,
          name: 'nonce',
          optional: false,
          type: 'String',
        },
      ],
      receive: false,
      returnType: {
        optional: false,
        type: 'Void',
      },
      send: false,
      sendUnsafe: false,
    },
    {
      claim: false,
      constant: false,
      name: 'fillOffer',
      parameters: [
        {
          forwardedValue: false,
          name: 'filler',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'offerHash',
          optional: false,
          type: 'Hash256',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'amountToTake',
          optional: false,
          type: 'Integer',
        },
        {
          forwardedValue: false,
          name: 'takerFeeAssetID',
          optional: false,
          type: 'Address',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'takerFeeAmount',
          optional: false,
          type: 'Integer',
        },
        {
          forwardedValue: false,
          name: 'burnTakerFee',
          optional: false,
          type: 'Boolean',
        },
        {
          decimals: 8,
          forwardedValue: false,
          name: 'makerFeeAmount',
          optional: false,
          type: 'Integer',
        },
        {
          forwardedValue: false,
          name: 'burnMakerFee',
          optional: false,
          type: 'Boolean',
        },
      ],
      receive: false,
      returnType: {
        optional: false,
        type: 'Void',
      },
      send: false,
      sendUnsafe: false,
    },
    {
      claim: false,
      constant: false,
      name: 'cancelOffer',
      parameters: [
        {
          forwardedValue: false,
          name: 'maker',
          optional: false,
          type: 'Address',
        },
        {
          forwardedValue: false,
          name: 'offerHash',
          optional: false,
          type: 'Hash256',
        },
      ],
      receive: false,
      returnType: {
        optional: false,
        type: 'Void',
      },
      send: false,
      sendUnsafe: false,
    },
    {
      constant: true,
      name: 'feeAddress',
      parameters: [],
      returnType: {
        forwardedValue: false,
        optional: false,
        type: 'Address',
      },
    },
    {
      name: 'setFeeAddress',
      parameters: [
        {
          forwardedValue: false,
          name: 'feeAddress',
          optional: false,
          type: 'Address',
        },
      ],
      returnType: {
        type: 'Void',
      },
    },
    {
      name: 'deploy',
      parameters: [
        {
          default: {
            type: 'sender',
          },
          forwardedValue: false,
          name: 'owner',
          optional: true,
          type: 'Address',
        },
      ],
      returnType: {
        type: 'Boolean',
      },
    },
  ],
};
