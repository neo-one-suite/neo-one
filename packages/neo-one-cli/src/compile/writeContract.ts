import { disassembleByteCode } from '@neo-one/node-core';
import { CompileContractResult } from '@neo-one/smart-contract-compiler';
import { utils } from '@neo-one/utils';
import fs from 'fs-extra';
import JSZip from 'jszip';
import _ from 'lodash';
import path from 'path';
import { SourceMapConsumer } from 'source-map';
import { convertABI, getDispatcherMethodDefinition, getJmpMethodDefinition, NEOONEContractMetadata } from './interop';

export interface CompileWriteOptions {
  readonly json: boolean;
  readonly avm: boolean;
  readonly debug: boolean;
  readonly opcodes: boolean;
}

const getJumpLength = (value: string): number => {
  const [, unknownOp] = value.split(':');
  const [op, arg] = unknownOp.split(' ');
  if (op !== 'JMP' && op !== 'JMP_L') {
    throw new Error(`${unknownOp} is not a JMP call`);
  }

  return Number(arg);
};

export const writeContract = async (
  filePath: string,
  contractIn: CompileContractResult,
  outDir: string,
  { json: jsonFlag, avm: avmFlag, debug: debugFlag, opcodes: opcodesFlag }: CompileWriteOptions,
) => {
  await fs.ensureDir(outDir);
  const outputPath = path.resolve(outDir, `${contractIn.contract.name}.contract.json`);

  const { sourceMap: sourceMapPromise, debugInfo, contract } = contractIn;

  const manifest = contract.manifest;

  // TODO: get this from compiler? Or change properties expected
  const metadata: NEOONEContractMetadata = {
    name: contract.name,
    description: 'A NEO•ONE Smart Contract',
    codeVersion: '1.0',
    author: 'NEO•ONE',
    email: 'contact@neo-one.io',
    storage: true,
    dynamicInvoke: true,
    payable: true,
  };

  const sourceMap = await sourceMapPromise;

  if (jsonFlag) {
    const contractJSON = JSON.stringify(contract, undefined, 2);
    await Promise.all([
      fs.writeFile(
        outputPath.replace('.contract.json', '.neoone.manifest.json'),
        JSON.stringify(manifest, undefined, 2),
      ),
      fs.writeFile(outputPath, contractJSON),
    ]);
  }

  const byteCode = Buffer.from(contract.script, 'hex');
  if (avmFlag) {
    await Promise.all([
      fs.writeFile(outputPath.replace('.contract.json', '.avm'), byteCode),
      fs.writeFile(
        outputPath.replace('.contract.json', '.abi.json'),
        JSON.stringify(convertABI(manifest.abi, metadata, byteCode), undefined, 2),
      ),
    ]);
  }

  if (debugFlag) {
    if (Object.keys(debugInfo).length < 1) {
      throw new Error('no method mappings were returned from compilation');
    }

    const disassembled = disassembleByteCode(byteCode);
    const jmpAddress = getJumpLength(disassembled[3].value); // TODO: abstract this index from compiler package. FIRST_JMP_IDX = 3;
    const endAddress = disassembled[disassembled.length - 1].pc;

    const jmpMethod = getJmpMethodDefinition(contract.name);
    const dispatcherMethod = getDispatcherMethodDefinition(contract.name, jmpAddress, endAddress);

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

    const methods = await SourceMapConsumer.with(
      sourceMap,
      // tslint:disable-next-line: no-null-keyword
      null,
      async (consumer) =>
        debugInfo.methods
          .map(({ name, params, returnType, range: originalRange }, index) => {
            const methodRange = getMethodRanges(consumer, originalRange[0] + 1);
            if (methodRange.length === 0) {
              return undefined;
              // a few cases don't generate sourcemaps that we can process like top-level readonly storage
              // throw new Error(`Error generating debug information, no map found for method: ${name}`);
            }

            const range = [methodRange[0], methodRange[methodRange.length - 1]];
            const sequencePoints = _.range(originalRange[0] + 1, originalRange[1] + 1).reduce<string[]>((acc, line) => {
              const generatedRanges = getMethodRanges(consumer, line);
              if (generatedRanges.length === 0) {
                return acc;
              }

              const start = generatedRanges[0];

              return acc.concat(`${start}[0]${line}:0-${line}:0`);
            }, []);

            return {
              id: `${index + 2}`,
              name: `${contract.name},${name}`,
              range: `${range[0]}-${range[1]}`,
              params,
              return: returnType,
              variables: [],
              'sequence-points': sequencePoints,
            };
          })
          .filter(utils.notNull),
    );

    const lastID = methods.length < 1 ? 2 : Number(methods[methods.length - 1].id) + 1;
    const debugJSON = {
      entrypoint: '0',
      documents: debugInfo.documents,
      methods: [jmpMethod, dispatcherMethod, ...methods],
      events: manifest.abi.events.map((event, index) => ({
        id: `${lastID + index}`,
        name: `${contract.name}-${event.name}`,
        params: event.parameters.map((param) => `${param.name},${param.type}`),
      })),
    };

    if (avmFlag) {
      const zip = new JSZip();
      zip.file<'text'>(`${contract.name}.debug.json`, JSON.stringify(debugJSON, undefined, 2));
      await new Promise((resolve) =>
        zip
          .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
          .pipe(fs.createWriteStream(outputPath.replace('.contract.json', '.avmdbgnfo')))
          .on('finish', () => {
            resolve();
          }),
      );
    }

    if (jsonFlag) {
      await fs.writeFile(outputPath.replace('.contract.json', '.debug.json'), JSON.stringify(debugJSON, undefined, 2));
    }

    if (opcodesFlag) {
      await fs.writeFile(
        outputPath.replace('.contract.json', '.avm.txt'),
        disassembled.reduce((acc, op) => `${acc}${op.value.split(':').join(' ')}\n`, ''),
      );
    }
  }
};
