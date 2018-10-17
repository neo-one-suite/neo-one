// tslint:disable no-any
import * as React from 'react';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import { styled } from 'reakit';
import { prop } from 'styled-tools';

const Wrapper = styled.div<{ readonly lr: boolean; readonly size: number }>`
  display: grid;
  min-height: 0;
  ${({ lr, size }) => {
    if (lr) {
      return `
        grid:
          'left resizer right' 1fr
          / calc(${size * 100}% - 1px) 1px calc(${(1 - size) * 100}% - 1px);
      `;
    }

    return `
      grid:
        'top' ${size}fr
        'resizer' 1px
        'bottom' ${1 - size}fr
        / 1fr;
    `;
  }};
`;

export const SplitPaneResizer = styled.div`
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
  readonly left: React.ReactNode;
  readonly right: React.ReactNode;
  readonly top?: undefined;
  readonly bottom?: undefined;
}

interface TBProps extends BaseProps {
  readonly type: 'tb';
  readonly top: React.ReactNode;
  readonly bottom: React.ReactNode;
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
    const { type, left, right, top, bottom, initialSize: _initialSize, ...props } = this.props;
    const { size } = this.state;

    let first: React.ReactNode;
    let second: React.ReactNode;
    if (type === 'lr') {
      first = left;
      second = right;
    } else {
      first = top;
      second = bottom;
    }

    const lr = type === 'lr';

    return (
      <Wrapper innerRef={this.wrapperRef} lr={lr} size={size} {...props}>
        {first}
        <DraggableCore onStart={this.onStartDrag} onDrag={this.onDrag} onStop={this.onStopDrag}>
          {lr ? <SplitPaneResizerLR /> : <SplitPaneResizerTB />}
        </DraggableCore>
        {second}
      </Wrapper>
    );
  }

  private readonly onStartDrag: DraggableEventHandler = () => {
    this.setState({ active: true });
  };

  private readonly onDrag: DraggableEventHandler = (_event, data) => {
    const wrapper = this.wrapperRef.current;
    if (wrapper !== null) {
      const totalSize = this.props.type === 'lr' ? wrapper.clientWidth : wrapper.clientHeight;
      const delta = this.props.type === 'lr' ? data.deltaX : data.deltaY;

      this.setState({
        size: Math.max(Math.min(this.state.size + delta / totalSize, 1), 0),
      });
    }
  };

  private readonly onStopDrag: DraggableEventHandler = () => {
    this.setState({ active: false });
  };
}
