// tslint:disable no-any strict-type-predicates
import styled from '@emotion/styled';
import { Box, Select, Tooltip, TooltipArrow } from '@neo-one/react-common';
import * as React from 'react';

const { useCallback, useState } = React;

const StyledSelect = styled(Select)`
  &&& {
    border-right: 0;
    width: 100px;
    height: 40px;
  }
`;

export function ToolbarSelector({
  'data-test-container': dataTestContainer,
  'data-test-selector': dataTestSelector,
  'data-test-tooltip': dataTestTooltip,
  help,
  ...rest
}: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const onMenuOpen = useCallback(() => {
    setMenuOpen(true);
    setHover(false);
  }, [setMenuOpen, setHover]);
  const onMenuClose = useCallback(() => {
    setMenuOpen(false);
    setHover(false);
  }, [setMenuOpen, setHover]);
  const onMouseEnter = useCallback(() => setHover(true), [setHover]);
  const onMouseLeave = useCallback(() => setHover(false), [setHover]);

  return (
    <Box data-test={dataTestContainer} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <StyledSelect
        data-test={dataTestSelector}
        menuPlacement="top"
        {...rest}
        onMenuOpen={onMenuOpen}
        onMenuClose={onMenuClose}
        menuPortalTarget={typeof document === 'undefined' ? undefined : document.body}
      />
      <Tooltip data-test={dataTestTooltip} visible={menuOpen ? false : hover} placement="top">
        <TooltipArrow />
        {help}
      </Tooltip>
    </Box>
  );
}
