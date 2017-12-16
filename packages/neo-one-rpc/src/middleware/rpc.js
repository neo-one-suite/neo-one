/* @flow */
// flowlint untyped-import:off
import {
  Account,
  Input,
  InvocationTransaction,
  JSONHelper,
  common,
  crypto,
  deserializeTransactionWire,
} from '@neo-one/core';
import { type Blockchain, type Node } from '@neo-one/node-core';
import type { GetActionsFilter } from '@neo-one/client';
import { utils } from '@neo-one/utils';
import { type Context } from 'koa';

import _ from 'lodash';
import compose from 'koa-compose';
import compress from 'koa-compress';
import connect from 'koa-connect';
import { filter, toArray } from 'rxjs/operators';
import jayson from 'jayson/promise';
import mount from 'koa-mount';

import { RPCError, RPCUnknownError } from '../errors';

import bodyParser from './bodyParser';
import { simpleMiddleware } from './common';

export default ({
  blockchain,
  node,
}: {|
  blockchain: Blockchain,
  node: Node,
|}) => {
  const checkHeight = (height: number) => {
    if (height < 0 && height > blockchain.currentBlockIndex) {
      // eslint-disable-next-line
      throw server.error(-100, 'Invalid Height');
    }
  };

  let server;
  const handlers = {
    getaccountstate: async args => {
      const hash = crypto.addressToScriptHash({
        addressVersion: blockchain.settings.addressVersion,
        address: args[0],
      });
      let account = await blockchain.account.tryGet({ hash });
      if (account == null) {
        account = new Account({ hash });
      }

      return account.serializeJSON(blockchain.serializeJSONContext);
    },
    getassetstate: async args => {
      const asset = await blockchain.asset.tryGet({
        hash: JSONHelper.readUInt256(args[0]),
      });

      if (asset == null) {
        throw server.error(-100, 'Unknown asset');
      }

      return asset.serializeJSON(blockchain.serializeJSONContext);
    },
    getbestblockhash: async () =>
      JSONHelper.writeUInt256(blockchain.currentBlock.hash),
    getblock: async args => {
      let hashOrIndex = args[0];
      if (typeof args[0] === 'string') {
        hashOrIndex = JSONHelper.readUInt256(args[0]);
      }

      const block = await blockchain.block.tryGet({ hashOrIndex });
      if (block == null) {
        throw server.error(-100, 'Unknown block');
      }

      if (args[1]) {
        const json = await block.serializeJSON(blockchain.serializeJSONContext);
        return json;
      }

      return block.serializeWire().toString('hex');
    },
    getblockcount: async () => blockchain.currentBlockIndex + 1,
    getblockhash: async args => {
      const height = args[0];
      checkHeight(height);
      const block = await blockchain.block.get({ hashOrIndex: height });
      return JSONHelper.writeUInt256(block.hash);
    },
    getblocksysfee: async args => {
      const height = args[0];
      checkHeight(height);
      const header = await blockchain.header.get({ hashOrIndex: height });
      const blockSystemFee = await blockchain.blockSystemFee.get({
        hash: header.hash,
      });
      return blockSystemFee.systemFee.toString(10);
    },
    getconnectioncount: async () => node.connectedPeersCount,
    getcontractstate: async args => {
      const hash = JSONHelper.readUInt160(args[0]);
      const contract = await blockchain.contract.tryGet({ hash });
      if (contract == null) {
        throw server.error(-100, 'Unknown contract');
      }

      return contract.serializeJSON(blockchain.serializeJSONContext);
    },
    getrawmempool: async () =>
      utils
        .values(node.memPool)
        .map(transaction => JSONHelper.writeUInt256(transaction.hash)),
    getrawtransaction: async args => {
      const hash = JSONHelper.readUInt256(args[0]);

      let transaction = node.memPool[common.uInt256ToHex(hash)];
      if (transaction == null) {
        transaction = await blockchain.transaction.tryGet({ hash });
      }
      if (transaction == null) {
        throw server.error(-100, 'Unknown transaction');
      }

      if (args[1]) {
        const json = await transaction.serializeJSON(
          blockchain.serializeJSONContext,
        );
        return json;
      }

      return transaction.serializeWire().toString('hex');
    },
    getstorage: async args => {
      const hash = JSONHelper.readUInt160(args[0]);
      const key = Buffer.from(args[1], 'hex');
      const item = await blockchain.storageItem.tryGet({ hash, key });
      return item == null ? null : item.value.toString('hex');
    },
    gettxout: async args => {
      const hash = JSONHelper.readUInt256(args[0]);
      const index = args[1];
      const [output, spentCoins] = await Promise.all([
        blockchain.output.tryGet({ hash, index }),
        blockchain.transactionSpentCoins.tryGet({ hash }),
      ]);
      if (spentCoins != null && spentCoins.endHeights[index] != null) {
        return null;
      }
      return output == null
        ? null
        : output.serializeJSON(blockchain.serializeJSONContext, index);
    },
    invoke: async () => {
      // TODO: Implement me
      throw server.error(-101, 'Not implemented');
    },
    invokefunction: async () => {
      // TODO: Implement me
      throw server.error(-101, 'Not implemented');
    },
    invokescript: async (args: [string]) => {
      const script = JSONHelper.readBuffer(args[0]);
      const result = await blockchain.invokeScript(script);
      return result.serializeJSON(blockchain.serializeJSONContext);
    },
    sendrawtransaction: async args => {
      const transaction = deserializeTransactionWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });
      try {
        await node.relayTransaction(transaction);
        return true;
      } catch (error) {
        return false;
      }
    },
    submitblock: async () => {
      // TODO: Implement me
      throw server.error(-101, 'Not implemented');
    },
    validateaddress: async args => {
      let scriptHash;
      try {
        scriptHash = crypto.addressToScriptHash({
          addressVersion: blockchain.settings.addressVersion,
          address: args[0],
        });
      } catch (error) {
        // eslint-disable-next-line
      }

      return { address: args[0], isvalid: scriptHash != null };
    },
    getpeers: async () => {
      // TODO: Implement me
      throw server.error(-101, 'Not implemented');
    },
    // Extended
    getoutput: async args => {
      const hash = JSONHelper.readUInt256(args[0]);
      const index = args[1];
      const output = await blockchain.output.tryGet({ hash, index });
      if (output == null) {
        throw server.error(-100, 'Unknown output');
      }

      return output.serializeJSON(blockchain.serializeJSONContext, index);
    },
    getclaimamount: async args => {
      const hash = JSONHelper.readUInt256(args[0]);
      const index = args[1];
      try {
        const value = await blockchain.calculateClaimAmount([
          new Input({
            hash,
            index,
          }),
        ]);
        return JSONHelper.writeFixed8(value);
      } catch (error) {
        throw server.error(-102, error.message);
      }
    },
    getactions: async (
      args: [
        {
          ...GetActionsFilter,
          scriptHash: string,
        },
      ],
    ) => {
      let actionsObservable = blockchain.action.getAll({
        blockIndexStart: args[0].blockIndexStart,
        transactionIndexStart: args[0].transactionIndexStart,
        indexStart: args[0].indexStart,
        blockIndexStop: args[0].blockIndexStop,
        transactionIndexStop: args[0].transactionIndexStop,
        indexStop: args[0].indexStop,
      });
      if (args[0].scriptHash != null) {
        const scriptHash = JSONHelper.readUInt160(args[0].scriptHash);
        actionsObservable = actionsObservable.pipe(
          filter(action => common.uInt160Equal(action.scriptHash, scriptHash)),
        );
      }
      const actions = await actionsObservable.pipe(toArray()).toPromise();
      return actions.map(action =>
        action.serializeJSON(blockchain.serializeJSONContext),
      );
    },
    getallstorage: async args => {
      const hash = JSONHelper.readUInt160(args[0]);
      const items = await blockchain.storageItem
        .getAll({ hash })
        .pipe(toArray())
        .toPromise();
      return items.map(item =>
        item.serializeJSON(blockchain.serializeJSONContext),
      );
    },
    testinvocation: async args => {
      const transaction = deserializeTransactionWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });
      if (transaction instanceof InvocationTransaction) {
        const result = await blockchain.invokeTransaction(transaction);
        return result.serializeJSON(blockchain.serializeJSONContext);
      }

      throw server.error(-103, 'Invalid InvocationTransaction');
    },
  };
  server = jayson.server(
    _.mapValues(handlers, handler => async (...args: $FlowFixMe): Promise<
      $FlowFixMe,
    > => {
      try {
        const result = await handler(...args);
        return result;
      } catch (error) {
        let logError = error;
        if (!(error instanceof Error)) {
          if (
            typeof error === 'object' &&
            error.code != null &&
            error.message != null
          ) {
            logError = new RPCError(error.code, error.message, error.data);
          } else {
            logError = new RPCUnknownError(error);
          }

          Error.captureStackTrace(logError);
        }
        blockchain.log({
          event: 'RPC_ERROR',
          error: logError,
        });

        throw error;
      }
    }),
  );

  return simpleMiddleware(
    'rpc',
    mount(
      '/rpc',
      compose([
        compress(),
        bodyParser(),
        async (ctx: Context, next: () => Promise<void>): Promise<void> => {
          const { fields } = ctx.request;
          if (fields != null) {
            // $FlowFixMe
            ctx.req.body = fields;
          }

          await next();
        },
        connect(server.middleware({ end: false })),
      ]),
    ),
  );
};
