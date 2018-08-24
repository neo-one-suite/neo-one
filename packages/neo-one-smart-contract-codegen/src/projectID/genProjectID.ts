export const genProjectID = ({ projectID }: { readonly projectID: string }) => ({
  ts: `
/**
 * @projectID ${projectID}
 */

export const projectID = '${projectID}';
`,
  js: `
/**
 * @projectID ${projectID}
 */

export const projectID = '${projectID}';
`,
});
