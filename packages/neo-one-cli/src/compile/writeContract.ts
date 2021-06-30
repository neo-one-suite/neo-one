import { BinaryWriter, common, crypto } from '@neo-one/client-common';
import { disassembleByteCode } from '@neo-one/node-core';
import { CompileContractResult } from '@neo-one/smart-contract-compiler';
import { utils } from '@neo-one/utils';
import fs from 'fs-extra';
import JSZip from 'jszip';
import _ from 'lodash';
import path from 'path';
import { SourceMapConsumer } from 'source-map';
import { convertManifest, getDispatcherMethodDefinition, getJmpLMethodDefinition } from './interop';

export interface CompileWriteOptions {
  readonly json: boolean;
  readonly nef: boolean;
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
  { json: jsonFlag, nef: nefFlag, debug: debugFlag, opcodes: opcodesFlag }: CompileWriteOptions,
) => {
  await fs.ensureDir(outDir);
  const outputPath = path.resolve(outDir, `${contractIn.contract.manifest.name}.contract.json`);

  const { sourceMap: sourceMapPromise, debugInfo, contract } = contractIn;

  const manifest = contract.manifest;

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

  const writer = new BinaryWriter();
  writer.writeUInt32LE(0);
  writer.writeFixedString(contractIn.contract.compiler, 64);

  if (nefFlag) {
    await Promise.all([
      fs.writeFile(outputPath.replace('.contract.json', '.nef'), byteCode),
      fs.writeFile(
        outputPath.replace('.contract.json', '.manifest.json'),
        // TODO: add "extra" here
        JSON.stringify(convertManifest(manifest, {}), undefined, 2),
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

    const jmpMethod = getJmpLMethodDefinition(contract.manifest.name);
    const dispatcherMethod = getDispatcherMethodDefinition(contract.manifest.name, jmpAddress, endAddress);

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
              name: `${contract.manifest.name},${name}`,
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
      hash: common.uInt160ToHex(crypto.toScriptHash(byteCode)),
      documents: debugInfo.documents,
      methods: [jmpMethod, dispatcherMethod, ...methods],
      'static-variables': ['scope,Array,0'],
      events: manifest.abi.events.map((event, index) => ({
        id: `${lastID + index}`,
        name: `${contract.manifest.name}-${event.name}`,
        params: event.parameters.map((param) => `${param.name},${param.type}`),
      })),
    };

    if (nefFlag) {
      const zip = new JSZip();
      zip.file<'text'>(`${contract.manifest.name}.debug.json`, JSON.stringify(debugJSON, undefined, 2));
      await new Promise((resolve) =>
        zip
          .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
          .pipe(fs.createWriteStream(outputPath.replace('.contract.json', '.nefdbgnfo')))
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
        outputPath.replace('.contract.json', '.nef.txt'),
        disassembled.reduce((acc, op) => `${acc}${op.value.split(':').join(' ')}\n`, ''),
      );
    }
  }
};
