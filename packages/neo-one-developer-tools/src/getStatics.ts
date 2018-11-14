// tslint:disable
export const getStatics = () => {
  const win = (typeof window !== 'undefined' ? window : {}) as Window;
  const doc = (typeof document !== 'undefined' ? document : { documentElement: {} }) as Document;
  const docEl = ((doc && doc.documentElement) || (doc && doc.body)) as HTMLElement;
  const winScreen = (win && win.screen) as Screen;

  return { win, doc, docEl, winScreen };
};
