/* @flow */
import {
  TRANSACTION_TYPE,
  type Block,
  Account,
  Input,
  InvocationTransaction,
  JSONHelper,
  common,
  crypto,
  deserializeTransactionWire,
} from '@neo-one/client-core';
import {
  type Blockchain,
  type Node,
  getEndpointConfig,
} from '@neo-one/node-core';
import { utils } from '@neo-one/utils';
import { type Context } from 'koa';

import _ from 'lodash';
import compose from 'koa-compose';
import compress from 'koa-compress';
import connect from 'koa-connect';
import { filter, map, take, timeout, toArray } from 'rxjs/operators';
import jayson from 'jayson/promise';
import mount from 'koa-mount';

import { RPCError, RPCUnknownError } from '../errors';

import bodyParser from './bodyParser';
import { simpleMiddleware } from './common';

const getTransactionReceipt = (value: Block, hash: string) => {
  const transactionIndex = value.transactions
    .map(transaction => transaction.hashHex)
    .indexOf(hash);
  if (transactionIndex === -1) {
    return null;
  }

  return {
    blockIndex: value.index,
    blockHash: JSONHelper.writeUInt256(value.hash),
    transactionIndex,
  };
};

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

      let watchTimeoutMS;
      if (args[1] != null && typeof args[1] === 'number' && args[1] !== 1) {
        // eslint-disable-next-line
        watchTimeoutMS = args[1];
      } else if (args[2] != null && typeof args[2] === 'number') {
        // eslint-disable-next-line
        watchTimeoutMS = args[2];
      }

      let block = await blockchain.block.tryGet({ hashOrIndex });
      if (block == null) {
        if (watchTimeoutMS == null) {
          throw server.error(-100, 'Unknown block');
        }
        try {
          block = await blockchain.block$
            .pipe(
              filter(
                value => value.hashHex === args[0] || value.index === args[0],
              ),
              take(1),
              timeout(new Date(Date.now() + watchTimeoutMS)),
            )
            .toPromise();
        } catch (error) {
          throw server.error(-100, 'Unknown block');
        }
      }

      if (args[1] === true || args[1] === 1) {
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
    getconnectioncount: async () => node.connectedPeers.length,
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

      if (args[1] === true || args[1] === 1) {
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
        // Ignore errors
      }

      return { address: args[0], isvalid: scriptHash != null };
    },
    getpeers: async () => ({
      connected: node.connectedPeers.map(endpoint => {
        const { host, port } = getEndpointConfig(endpoint);
        return { address: host, port };
      }),
    }),
    // Extended
    relaytransaction: async args => {
      const transaction = deserializeTransactionWire({
        context: blockchain.deserializeWireContext,
        buffer: JSONHelper.readBuffer(args[0]),
      });
      try {
        const [transactionJSON] = await Promise.all([
          transaction.serializeJSON(blockchain.serializeJSONContext),
          node.relayTransaction(transaction),
        ]);
        return transactionJSON;
      } catch (error) {
        throw server.error(-110, `Relay transaction failed: ${error.message}`);
      }
    },
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
        return common.fixed8ToDecimal(value).toString();
      } catch (error) {
        throw server.error(-102, error.message);
      }
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
    gettransactionreceipt: async args => {
      const spentCoins = await blockchain.transactionSpentCoins.tryGet({
        hash: JSONHelper.readUInt256(args[0]),
      });

      let watchTimeoutMS;
      if (args[1] != null && typeof args[1] === 'number') {
        // eslint-disable-next-line
        watchTimeoutMS = args[1];
      }

      let result;
      if (spentCoins == null) {
        if (watchTimeoutMS == null) {
          throw server.error(-100, 'Unknown transaction');
        }

        result = await blockchain.block$
          .pipe(
            map(value => getTransactionReceipt(value, args[0])),
            filter(receipt => receipt != null),
            take(1),
            timeout(new Date(Date.now() + watchTimeoutMS)),
          )
          .toPromise();
      } else {
        const block = await blockchain.block.get({
          hashOrIndex: spentCoins.startHeight,
        });
        result = getTransactionReceipt(block, args[0]);
      }

      return result;
    },
    getinvocationdata: async args => {
      const transaction = await blockchain.transaction.get({
        hash: JSONHelper.readUInt256(args[0]),
      });

      const result = await transaction.serializeJSON(
        blockchain.serializeJSONContext,
      );
      if (result.data == null) {
        throw server.error(-103, 'Invalid InvocationTransaction');
      }

      return result.data;
    },
    getvalidators: async () => {
      const validators = await blockchain.validator.all
        .pipe(toArray())
        .toPromise();
      return validators.map(validator =>
        validator.serializeJSON(blockchain.serializeJSONContext),
      );
    },
    getnetworksettings: async () => {
      const issueGASFee = common.fixed8ToDecimal(
        blockchain.settings.fees[TRANSACTION_TYPE.ISSUE],
      );
      return {
        issueGASFee: issueGASFee.toString(),
      };
    },
    runconsensusnow: () => {
      if (node.consensus) {
        node.consensus.runConsensusNow();
      } else {
        throw new Error('This node does not support trigger consensus.');
      }
    },
    updatesettings: args => {
      const { settings } = blockchain;
      const newSettings = {
        ...settings,
        secondsPerBlock: args[0].secondsPerBlock,
      };

      blockchain.updateSettings(newSettings);
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
