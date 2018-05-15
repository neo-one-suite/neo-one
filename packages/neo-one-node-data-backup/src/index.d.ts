export interface GCloudProviderOptions {
  projectID: string;
  bucket: string;
  file: string;
  writeBytesPerSecond: number;
}

export interface MegaProviderOptions {
  download?: {
    id: string;
    key: string;
    writeBytesPerSecond: number;
  };
  upload?: {
    email: string;
    password: string;
    file: string;
  };
}

export interface BackupRestoreOptions {
  gcloud?: GCloudProviderOptions;
  mega?: MegaProviderOptions;
}

export interface BackupRestoreEnvironment {
  dataPath: string;
  tmpPath: string;
  readyPath: string;
}
