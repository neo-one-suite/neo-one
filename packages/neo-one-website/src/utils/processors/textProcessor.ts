// tslint:disable only-arrow-functions no-object-mutation no-any

const extractTextWithoutComments = (declaration: ts.Declaration) =>
  declaration
    .getText(declaration.getSourceFile())
    .split('\n')
    .filter((line: string) => {
      const trimmedLine = line.trim();

      return trimmedLine !== '/**' && trimmedLine.charAt(0) !== '*' && trimmedLine.charAt(0) !== '/';
    })
    .join('\n');

const extractBasicText = (text: string, docType: string, name: string) => {
  if (docType === 'class') {
    return text.substr(0, text.indexOf(' {'));
  }
  if (name === 'constructor') {
    return text.substr(0, text.indexOf(') {') + 1);
  }
  if (text.includes('{')) {
    return text.substr(0, text.indexOf(' {', text.indexOf('):') + 1));
  }

  return text;
};

const separateLines = (text: string) => text.split('\n').filter((line: string) => line !== '');

const separateLinesForJSON = (doc: any, text: string) => {
  doc.text =
    doc.docType === 'class' || doc.parameterDocs !== undefined
      ? extractBasicText(text, doc.docType, doc.name).split('\n')
      : text.split('\n');

  doc.description = separateLines(doc.description);
  if (doc.returns) {
    doc.returns.description = separateLines(doc.returns.description);
  }
  if (doc.type) {
    doc.type = separateLines(doc.type);
  }
  if (doc.example) {
    doc.example = doc.example.map(separateLines);
  }
};

const handleDecorators = (doc: any) => {
  if (
    doc.parameterDocs &&
    doc.parameterDocs.length === 3 &&
    doc.parameterDocs[0].name === 'target' &&
    doc.parameterDocs[1].name === 'propertyKey' &&
    doc.parameterDocs[2].name === 'descriptor'
  ) {
    doc.docType = 'decorator';
    const decoratorName = `@${doc.name}`;
    doc.outputPath = doc.outputPath.replace(doc.name, decoratorName);
    doc.name = decoratorName;
  }
};

const updateOutputPathToJSON = (doc: any) => {
  if (doc.outputPath) {
    doc.outputPath = doc.outputPath.replace('.html', '.json');
  }
};

export function textProcessor() {
  return {
    $runAfter: ['paths-computed'],
    $runBefore: ['rendering-docs'],
    $process(docs: readonly any[]) {
      docs
        .filter((doc: any) => doc.docType !== 'function-overload')
        .forEach((doc: any) => {
          const text =
            doc.additionalDeclarations && doc.additionalDeclarations.length > 0
              ? extractTextWithoutComments(doc.additionalDeclarations[0])
              : extractTextWithoutComments(doc.declaration);

          handleDecorators(doc);
          separateLinesForJSON(doc, text);
          updateOutputPathToJSON(doc);
        });
    },
  };
}
