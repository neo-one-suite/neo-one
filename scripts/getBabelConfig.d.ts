export default function getBabelConfig(options: {
  modules: boolean | string;
  useBuiltIns: boolean | string | undefined;
  targets: object;
}): object;
