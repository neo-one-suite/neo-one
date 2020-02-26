// tslint:disable no-any
import styled from '@emotion/styled';
import * as React from 'react';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import { prop, withProp } from 'styled-tools';

interface WrapperProps {
  readonly lr: boolean;
  readonly size: number;
}

const wrapperFunc = (lr: boolean, size: number) => {
  let grid: string;
  if (lr) {
    grid = `
          'left resizer right' 1fr
          / calc(${size * 100}% - 1px) 1px calc(${(1 - size) * 100}% - 1px)
      `;
  } else {
    grid = `
        'top' ${size}fr
        'resizer' 1px
        'bottom' ${1 - size}fr
        / 1fr
    `;
  }

  return {
    grid,
  };
};

const wrapperWithProps = withProp<WrapperProps, ReturnType<typeof wrapperFunc>>(['lr', 'size'], wrapperFunc);

// tslint:disable-next-line no-any
const Wrapper: any = styled('div')`
  display: grid;
  min-height: 0;
  ${wrapperWithProps}
`;

export const SplitPaneResizer = styled.div<{}, {}>`
  background-color: ${prop('theme.gray5')};
  background-clip: padding-box;
  box-sizing: border-box;
  z-index: 30;

  &:hover {
    transition: all 0.3s ease;
  }
`;

const SplitPaneResizerLR = styled(SplitPaneResizer)`
  margin: 0 -5px;
  cursor: col-resize;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;

  &:hover {
    border-left: 5px solid rgba(64, 56, 76, 0.5);
    border-right: 5px solid rgba(64, 56, 76, 0.5);
  }
`;

const SplitPaneResizerTB = styled(SplitPaneResizer)`
  margin: -5px 0;
  cursor: row-resize;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;

  &:hover {
    border-top: 5px solid rgba(64, 56, 76, 0.5);
    border-bottom: 5px solid rgba(64, 56, 76, 0.5);
  }
`;

interface State {
  readonly active: boolean;
  readonly size: number;
}

interface BaseProps {
  readonly initialSize: number;
}

interface LRProps extends BaseProps {
  readonly type: 'lr';
  readonly left: React.ReactElement;
  readonly right: React.ReactElement;
  readonly collapseRight?: boolean;
  readonly onExpandRight?: () => void;
  readonly top?: undefined;
  readonly bottom?: undefined;
}

interface TBProps extends BaseProps {
  readonly type: 'tb';
  readonly top: React.ReactElement;
  readonly bottom: React.ReactElement;
  readonly collapseRight?: undefined;
  readonly onExpandRight?: undefined;
  readonly left?: undefined;
  readonly right?: undefined;
}

type Props = LRProps | TBProps;

export class SplitPane extends React.Component<Props, State> {
  public readonly state: State = {
    active: false,
    size: this.props.initialSize,
  };
  private readonly wrapperRef = React.createRef<HTMLDivElement>();

  public render() {
    const {
      type,
      left,
      right,
      top,
      bottom,
      initialSize: _initialSize,
      collapseRight,
      onExpandRight: _onExpandRight,
      ...props
    } = this.props;
    const { active } = this.state;
    let { size } = this.state;

    let first: React.ReactElement;
    let second: React.ReactElement;
    if (type === 'lr') {
      first = left as React.ReactElement;
      second = right as React.ReactElement;
      size = collapseRight ? 1.0 : size;
    } else {
      first = top as React.ReactElement;
      second = bottom as React.ReactElement;
    }

    const lr = type === 'lr';

    if (active) {
      first = React.cloneElement(first, { style: { pointerEvents: 'none' } });
      second = React.cloneElement(second, { style: { pointerEvents: 'none' } });
    }

    return (
      <Wrapper ref={this.wrapperRef} lr={lr} size={size} {...props}>
        {first}
        <DraggableCore onStart={this.onStartDrag} onDrag={this.onDrag} onStop={this.onStopDrag}>
          {lr ? <SplitPaneResizerLR /> : <SplitPaneResizerTB />}
        </DraggableCore>
        {second}
      </Wrapper>
    );
  }

  private readonly onStartDrag: DraggableEventHandler = () => {
    const { onExpandRight, collapseRight } = this.props;

    this.setState({ active: true, size: collapseRight ? 1.0 : this.state.size });
    if (onExpandRight !== undefined) {
      onExpandRight();
    }
  };

  private readonly onDrag: DraggableEventHandler = (_event, data) => {
    const wrapper = this.wrapperRef.current;
    if (wrapper !== null) {
      const totalSize = this.props.type === 'lr' ? wrapper.clientWidth : wrapper.clientHeight;
      const delta = this.props.type === 'lr' ? data.deltaX : data.deltaY;

      const size = Math.max(Math.min(this.state.size + delta / totalSize, 1), 0);
      this.setState({ size });
    }
  };

  private readonly onStopDrag: DraggableEventHandler = () => {
    this.setState({ active: false });
  };
}
