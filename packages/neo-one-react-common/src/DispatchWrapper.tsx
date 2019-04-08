import { Box, styledOmitProps } from '@neo-one/react-core';

export const DispatchWrapper = styledOmitProps<{ readonly dispatch: boolean }>(Box, ['dispatch'])``;
