/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  ABIParameter,
  Action,
  AddressString,
  ContractEventDescriptorClient,
  ContractMethodDescriptorClient,
  Event,
  ForwardOptions,
  GetOptions,
  Hash256String,
  InvokeReceipt,
  InvokeSendUnsafeReceiveTransactionOptions,
  Log,
  NetworkType,
  Param,
  RawAction,
  RawInvokeReceipt,
  Return,
  ScriptBuilderParam,
  SmartContractDefinition,
  SmartContractIterOptions,
  SmartContractNetworkDefinition,
  TransactionResult,
  Transfer,
} from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { filter } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/filter';
import { map } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
import * as argAssertions from '../args';
import { Client } from '../Client';
import { NoContractDeployedError } from '../errors';
import { events as traceEvents } from '../trace';
import { SmartContractAny } from '../types';
import * as common from './common';

interface ParamAndOptionsResults {
  // tslint:disable-next-line:no-any
  readonly requiredArgs: readonly any[];
  // tslint:disable-next-line:no-any
  readonly options: any;
  readonly forwardOptions: ForwardOptions | undefined;
  readonly transfer: Transfer | undefined;
  readonly hash: Hash256String | undefined;
}

export const getParamAndOptionsResults = ({
  parameters,
  args,
}: {
  readonly parameters: readonly ABIParameter[];
  // tslint:disable-next-line no-any
  readonly args: readonly any[];
}): ParamAndOptionsResults => {
  const hasRest = parameters.length > 0 && parameters[parameters.length - 1].rest;
  const hasForwardValueOptions = hasRest && parameters[parameters.length - 1].type === 'ForwardValue';

  return args.reduceRight<ParamAndOptionsResults>(
    (acc, right) => {
      if (hasForwardValueOptions && acc.forwardOptions === undefined && common.isForwardValueOptions(right)) {
        return {
          ...acc,
          forwardOptions: right,
        };
      }

      if (common.isTransactionOptions(right) && acc.options === undefined) {
        return {
          ...acc,
          options: right,
        };
      }

      // TODO: this block can almost definitely be removed. also remove transfer return likely
      if (acc.transfer === undefined) {
        try {
          const maybeTransfer = argAssertions.assertTransfer('transfer', right);

          return {
            ...acc,
            transfer: maybeTransfer,
          };
        } catch {
          //
        }
      }

      // TODO: this block can almost definitely be removed. also remove hash return likely
      if (acc.hash === undefined) {
        try {
          const maybeHash = argAssertions.assertHash256('hash', right);

          return {
            ...acc,
            hash: maybeHash,
          };
        } catch {
          //
        }
      }

      return {
        ...acc,
        requiredArgs: [right].concat(acc.requiredArgs),
      };
    },
    {
      requiredArgs: [],
      options: undefined,
      forwardOptions: undefined,
      transfer: undefined,
      hash: undefined,
    },
  );
};

export const getParamsAndOptions = ({
  definition: { networks },
  parameters,
  args,
  receive,
  client,
}: {
  readonly definition: SmartContractDefinition;
  readonly parameters: readonly ABIParameter[];
  // tslint:disable-next-line no-any
  readonly args: readonly any[];
  readonly receive: boolean;
  readonly client: Client;
}): {
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
  readonly paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>;
  readonly options: InvokeSendUnsafeReceiveTransactionOptions;
  readonly forwardOptions: ForwardOptions;
  readonly network: NetworkType;
  readonly address: AddressString;
  readonly transfer?: Transfer;
  readonly hash?: Hash256String;
} => {
  const {
    requiredArgs,
    forwardOptions,
    options: optionsIn,
    transfer,
    hash,
  } = getParamAndOptionsResults({
    parameters,
    args,
  });

  const currentAccount = client.getCurrentUserAccount();
  const options =
    (optionsIn === undefined || optionsIn.from === undefined) && currentAccount !== undefined
      ? {
          ...optionsIn,
          from: currentAccount.id,
        }
      : {
          ...optionsIn,
        };
  const network =
    options.network === undefined
      ? options.from === undefined
        ? client.getCurrentNetwork()
        : options.from.network
      : options.network;

  const contractNetwork = networks[network] as SmartContractNetworkDefinition | undefined;
  if (contractNetwork === undefined) {
    throw new NoContractDeployedError(network);
  }
  // TODO: may need to add another check here depending on if we keep @receive decorator
  // if (options.sendTo !== undefined && !receive) {
  //   throw new CannotSendToContractError(contractNetwork.address);
  // }

  const { converted, zipped } = common.convertParams({
    params: requiredArgs,
    parameters,
    senderAddress: currentAccount === undefined ? undefined : currentAccount.id.address,
  });

  return {
    params: converted,
    paramsZipped: zipped,
    options,
    forwardOptions: forwardOptions === undefined ? {} : forwardOptions,
    network,
    address: contractNetwork.address,
    transfer,
    hash,
  };
};

const createCall =
  ({
    definition,
    client,
    func: { name, parameters = [], returnType, receive = false },
  }: {
    readonly definition: SmartContractDefinition;
    readonly client: Client;
    readonly func: ContractMethodDescriptorClient;
  }) =>
  // tslint:disable-next-line no-any
  async (...args: any[]): Promise<Return | undefined> => {
    const { params, network, address } = getParamsAndOptions({
      definition,
      parameters,
      args,
      receive,
      client,
    });

    // For NEO•ONE contracts we need to add method name as the first param. This should be fixed
    const paramsIn = [name, ...params];
    const receipt = await client.__call(network, address, name, paramsIn);

    return common.convertCallResult({
      returnType,
      result: receipt.result,
      actions: receipt.actions,
      sourceMaps: definition.sourceMaps,
    });
  };

const createInvoke = ({
  definition,
  client,
  func: { name, parameters = [], returnType, receive = false },
}: {
  readonly definition: SmartContractDefinition;
  readonly client: Client;
  readonly func: ContractMethodDescriptorClient;
}) => {
  const invoke = async (
    // tslint:disable-next-line no-any
    ...args: any[]
  ): Promise<TransactionResult<InvokeReceipt> | TransactionResult> => {
    const { params, paramsZipped, options, forwardOptions, address } = getParamsAndOptions({
      definition,
      parameters,
      args,
      receive,
      client,
    });

    const result: TransactionResult<RawInvokeReceipt> = await client.__invoke(
      address,
      name,
      [name, ...params], // For NEO•ONE contracts we need to add method name as the first param. This should be fixed
      paramsZipped,
      receive,
      options,
      definition.sourceMaps,
    );

    return {
      transaction: result.transaction,
      confirmed: async (getOptions?): Promise<InvokeReceipt> => {
        const receipt = await result.confirmed(getOptions);
        const { events = [] } = definition.manifest.abi;
        const { events: forwardEvents = [] } = forwardOptions;
        const actions = common.convertActions({
          actions: receipt.actions,
          events: events.concat(forwardEvents),
        });

        const invocationResult = await common.convertInvocationResult({
          returnType,
          result: receipt.result,
          actions: receipt.actions,
          sourceMaps: definition.sourceMaps,
        });

        return {
          blockIndex: receipt.blockIndex,
          blockHash: receipt.blockHash,
          globalIndex: receipt.globalIndex,
          transactionIndex: receipt.transactionIndex,
          result: invocationResult,
          events: common.filterEvents(actions),
          logs: common.filterLogs(actions),
          raw: receipt,
        };
      },
    };
  };
  // tslint:disable-next-line no-any no-object-mutation
  (invoke as any).confirmed = async (...args: any[]) => {
    // tslint:disable-next-line no-any
    const finalArg = args[args.length - 1];
    let options: GetOptions | undefined;
    if (common.isOptionsBase(finalArg)) {
      options = finalArg;
    }
    const result = await invoke(...args);
    const receipt = await result.confirmed(options);

    return { ...receipt, transaction: result.transaction };
  };

  return invoke;
};

export const createSmartContract = ({
  definition,
  client,
}: {
  readonly definition: SmartContractDefinition;
  readonly client: Client;
}): SmartContractAny => {
  const {
    manifest: {
      abi: { events: abiEvents = [] },
    },
  } = definition;

  const events = traceEvents.concat(abiEvents).reduce<{ [key: string]: ContractEventDescriptorClient }>(
    (acc, event) => ({
      ...acc,
      [event.name]: event,
    }),
    {},
  );

  const iterActionsRaw = ({
    network = client.getCurrentNetwork(),
    ...iterOptions
  }: SmartContractIterOptions = {}): AsyncIterable<RawAction> =>
    AsyncIterableX.from(client.__iterActionsRaw(network, iterOptions)).pipe<RawAction>(
      filter((action) => action.address === definition.networks[network].address),
    );

  const convertAction = (action: RawAction): Action | undefined => {
    const converted = common.convertAction({ action, events });

    return typeof converted === 'string' ? undefined : converted;
  };

  const iterActions = (options?: SmartContractIterOptions): AsyncIterable<Action> =>
    AsyncIterableX.from(iterActionsRaw(options)).pipe(map(convertAction), filter(utils.notNull));

  const iterEvents = (options?: SmartContractIterOptions): AsyncIterable<Event> =>
    AsyncIterableX.from(iterActions(options)).pipe(
      map((action) => {
        if (action.type === 'Log') {
          return undefined;
        }

        return action;
      }),
      filter(utils.notNull),
      filter<Event>(Boolean),
    );

  const iterLogs = (options?: SmartContractIterOptions): AsyncIterable<Log> =>
    AsyncIterableX.from(iterActions(options)).pipe(
      map((action) => {
        if (action.type === 'Event') {
          return undefined;
        }

        return action;
      }),
      filter(utils.notNull),
      filter<Log>(Boolean),
    );

  return definition.manifest.abi.methods.reduce<SmartContractAny>(
    (acc, func) =>
      common.addForward(func, abiEvents, {
        ...acc,
        [func.name]:
          func.constant === true
            ? createCall({
                definition,
                client,
                func,
              })
            : createInvoke({
                definition,
                client,
                func,
              }),
      }),
    {
      client,
      iterEvents,
      iterLogs,
      iterActions,
      convertAction,
      definition,
    },
  );
};
