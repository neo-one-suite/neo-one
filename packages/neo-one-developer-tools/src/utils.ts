import { getStatics } from './getStatics';

// tslint:disable-next-line export-name
export const getSize = () => ({
  width: getStatics().docEl.clientWidth,
  height: getStatics().docEl.clientHeight,
});
