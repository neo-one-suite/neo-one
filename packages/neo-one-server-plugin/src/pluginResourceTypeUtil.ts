const SEP = ':';
const make = ({ plugin, resourceType }: { readonly plugin: string; readonly resourceType: string }): string =>
  `${plugin}${SEP}${resourceType}`;

const extract = (
  pluginResourceType: string,
): {
  readonly plugin: string;
  readonly resourceType: string;
} => {
  const [plugin, resourceType] = pluginResourceType.split(SEP);

  return { plugin, resourceType };
};

export const pluginResourceTypeUtil = {
  extract,
  make,
};
