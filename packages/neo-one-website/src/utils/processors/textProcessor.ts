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

const extractBasicText = (text: string) => text.substr(0, text.indexOf(' {'));

const separateLines = (text: string) => text.split('\n').filter((line: string) => line !== '');

export function textProcessor() {
  return {
    $runAfter: ['paths-computed'],
    $runBefore: ['rendering-docs'],
    $process(docs: ReadonlyArray<any>) {
      docs.forEach((doc: any) => {
        const text = extractTextWithoutComments(doc.declaration);

        doc.text =
          doc.docType === 'class' || doc.parameterDocs !== undefined
            ? extractBasicText(text).split('\n')
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

        if (doc.outputPath) {
          doc.outputPath = doc.outputPath.replace('.html', '.json');
        }
      });
    },
  };
}
