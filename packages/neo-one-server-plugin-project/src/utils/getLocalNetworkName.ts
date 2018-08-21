import * as path from 'path';

export const getLocalNetworkName = (rootDir: string, projectID: string) =>
  `${path.basename(rootDir)}-local-${projectID}`;
