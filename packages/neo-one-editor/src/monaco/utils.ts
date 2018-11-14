/// <reference types="monaco-editor/monaco" />
// tslint:disable-next-line export-name
export const disposeModel = (model: monaco.editor.ITextModel) => {
  if (!model.isDisposed()) {
    const owners = new Set([...monaco.editor.getModelMarkers({}).map(({ owner }) => owner)]);
    owners.forEach((owner) => {
      monaco.editor.setModelMarkers(model, owner, []);
    });

    model.dispose();
  }
};
