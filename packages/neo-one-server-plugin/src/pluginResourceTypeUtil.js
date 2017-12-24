/* @flow */
const SEP = ':';
const make = ({
  plugin,
  resourceType,
}: {|
  plugin: string,
  resourceType: string,
|}): string => `${plugin}${SEP}${resourceType}`;

const extract = (
  pluginResourceType: string,
): {|
  plugin: string,
  resourceType: string,
|} => {
  const [plugin, resourceType] = pluginResourceType.split(SEP);
  return { plugin, resourceType };
};

export default {
  extract,
  make,
};
