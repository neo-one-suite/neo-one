import { ContractMethodDescriptorClient } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import { SourceMapConsumer } from 'source-map';
import { SmartContractInfoManifest, SmartContractInfoMethodDescriptor } from '../compile/getSmartContractInfo';
import { ScriptBuilderResult } from '../compile/types';
import { Context } from '../Context';
import { DebugInfo, DebugMethod } from '../contract';
import { disassembleByteCode } from './disassembleByteCode';

export const getJumpLength = (value: string): number => {
  const [, unknownOp] = value.split(':');
  const [op, arg] = unknownOp.split(' ');
  if (op !== 'JMP' && op !== 'JMP_L') {
    throw new Error(`${unknownOp} is not a JMP call`);
  }

  return Number(arg);
};

export const processMethods = async ({
  // tslint:disable-next-line: no-unused
  context,
  manifest,
  debugInfo,
  finalResult,
  filePath,
}: {
  readonly context: Context;
  readonly manifest: SmartContractInfoManifest;
  readonly debugInfo: DebugInfo;
  readonly finalResult: ScriptBuilderResult;
  readonly filePath: string;
}): Promise<readonly ContractMethodDescriptorClient[]> => {
  const methodsIn = manifest.abi.methods;

  if (methodsIn.length !== debugInfo.methods.length) {
    throw new Error(
      `Expected Manifest methods length ${methodsIn.length} to equal DebugInfo methods length ${debugInfo.methods.length}. Please report.`,
    );
  }

  if (methodsIn.length === 0) {
    return [];
  }

  // TODO: include upgrade and deploy or no? In debug info
  const newDebugInfoMethods = _.zipWith(
    methodsIn,
    debugInfo.methods,
    (manMethod: SmartContractInfoMethodDescriptor, debugMethod: DebugMethod) => {
      if (manMethod.name !== debugMethod.name) {
        throw new Error('Error processing methods. Method names do not match. Please report.');
      }

      if (manMethod.returnType.type !== debugMethod.returnType) {
        throw new Error('Error processing methods. Method return types do not match. Please report.');
      }

      return {
        manifestMethod: manMethod,
        debugMethod,
      };
    },
  );

  const sourceMap = await finalResult.sourceMap;
  const byteCode = finalResult.code;
  const disassembled = disassembleByteCode(byteCode);
  const jmpAddress = getJumpLength(disassembled[3].value); // First jump is now the fourth line

  const getMethodRanges = (consumer: SourceMapConsumer, line: number) =>
    consumer
      .allGeneratedPositionsFor({
        source: filePath,
        line,
        column: undefined,
        // tslint:disable-next-line: no-any
      } as any)
      .map(({ line: lineOut }) => {
        if (lineOut !== null) {
          return Number(disassembled[lineOut - 1].pc);
        }
        throw new Error('Unexpected error mapping source code');
      })
      .sort((a: number, b: number) => (a === b ? 0 : a > b ? 1 : -1))
      .filter((value) => value < jmpAddress);

  return SourceMapConsumer.with(
    sourceMap,
    // tslint:disable-next-line: no-null-keyword
    null,
    async (consumer) =>
      newDebugInfoMethods
        .map(({ debugMethod: { range }, manifestMethod }) => {
          const methodRange = getMethodRanges(consumer, range[0] + 1);
          if (methodRange.length === 0) {
            return {
              ...manifestMethod,
              offset: 0,
            };
            // return undefined; // TODO: used to be undefined but we need to make sure methods like "deploy" make it into manifest
            // even if it doesn't have any sourcemap mapping. clean this up when fixing how we call contract methods
            // a few cases don't generate sourcemaps that we can process like top-level readonly storage
            // throw new Error(`Error generating debug information, no map found for method: ${name}`);
          }

          return {
            ...manifestMethod,
            offset: 0, // methodRange[0], // TODO: fix here for calling contracts
          };
        })
        .filter(utils.notNull),
  );
};
