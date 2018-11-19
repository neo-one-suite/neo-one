import { palette, withProp } from 'styled-tools';

export interface ColorProps {
  readonly opaque?: boolean;
  readonly palette?: string;
  readonly tone?: number;
}

export const bgColorWithProps = withProp(['opaque', 'palette', 'tone'], (opaque, paletteProp, tone = 0) => {
  if (!opaque) {
    return 'unset';
  }

  return palette(paletteProp, tone, 'unset');
});

export const textColorWithProps = withProp(['opaque', 'palette', 'tone'], (opaque, paletteProp, tone = 0) =>
  palette(opaque ? `${paletteProp}Text` : paletteProp, tone, 'inherit'),
);
