export const genProjectID = ({ projectID }: { readonly projectID: string }) => ({
  ts: `
export const projectID = '${projectID}';
`,
  js: `
export const projectID = '${projectID}';
`,
});
