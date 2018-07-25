import { RawSourceMap } from 'source-map';
import ts from 'typescript';

interface Result {
  readonly text: string;
  readonly sourceMap: RawSourceMap;
}
export const print = (programIn: ts.Program, original: ts.SourceFile, file: ts.SourceFile): Result => {
  // tslint:disable-next-line no-any
  const program: any = programIn;
  // tslint:disable-next-line no-any
  const compiler: any = ts;

  const host = {
    getPrependNodes: () => [],
    getCanonicalFileName: (fileName: string) => (ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase()),
    getCommonSourceDirectory: program.getCommonSourceDirectory,
    getCompilerOptions: program.getCompilerOptions,
    getCurrentDirectory: program.getCurrentDirectory,
    getNewLine: () => ts.NewLineKind.LineFeed,
    getSourceFile: program.getSourceFile,
    getSourceFileByPath: program.getSourceFileByPath,
    getSourceFiles: program.getSourceFiles,
    isSourceFileFromExternalLibrary: program.isSourceFileFromExternalLibrary,
    writeFile: ts.sys.writeFile,
    readFile: ts.sys.readFile,
    fileExists: ts.sys.fileExists,
    directoryExists: ts.sys.directoryExists,
  };
  const writer = compiler.createTextWriter('\n');
  const sourceMap = compiler.createSourceMapWriter(host, writer, {
    ...program.getCompilerOptions(),
    sourceMap: true,
  });
  sourceMap.initialize(file.fileName, `${file.fileName}.map`);

  const printer = compiler.createPrinter(
    { ...program.getCompilerOptions() },
    {
      onEmitSourceMapOfNode: sourceMap.emitNodeWithSourceMap,
      onEmitSourceMapOfToken: sourceMap.emitTokenWithSourceMap,
      onEmitSourceMapOfPosition: sourceMap.emitPos,
      onSetSourceFile: sourceMap.setSourceFile,
    },
  );

  printer.writeFile(file, writer);

  return {
    text: writer.getText(),
    sourceMap: {
      ...JSON.parse(sourceMap.getText()),
      sourcesContent: [original.getFullText()],
    },
  };
};

export const setOriginal = <T extends ts.Node>(node: T, original: ts.Node): T =>
  ts.setSourceMapRange(ts.setOriginalNode(node, original), original);
