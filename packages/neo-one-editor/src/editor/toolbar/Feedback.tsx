// tslint:disable no-any
import { Link } from '@neo-one/react-common';
import { ActionMap, Container } from 'constate';
import * as React from 'react';
import { FaTwitter } from 'react-icons/fa';
import { IoMdHappy, IoMdSad } from 'react-icons/io';
import { as, Box, Button, Grid, Input, Link as LinkBase, styled } from 'reakit';
import { ifProp, prop } from 'styled-tools';
import { ToolbarPopover } from './ToolbarPopover';

const HappyToolbarButton = styled(IoMdHappy)`
  width: 16px;
  height: 16px;
`;

const ButtonBase = styled(Button)<{ readonly selected: boolean }>`
  border: 1px solid ${ifProp('selected', prop('theme.accent'), 'transparent')};
  color: ${prop('theme.gray0')};
  width: 32px;
  height: 32px;
  cursor: pointer;
  outline: none;
`;

const HappyButton = as(IoMdHappy)(ButtonBase);
const SadButton = as(IoMdSad)(ButtonBase);

const Text = styled(Box)`
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
`;

const ButtonWrapper = styled(Grid)`
  grid-auto-flow: column;
  justify-content: start;
`;

const RowWrapper = styled(Grid)`
  grid-auto-flow: row;
  grid-auto-rows: auto;
`;

const Wrapper = styled(RowWrapper)`
  grid-gap: 8px;
`;

const ContactWrapper = styled(RowWrapper)`
  background-color: ${prop('theme.gray6')};
  padding: 8px;
`;

const BottomWrapper = styled(RowWrapper)`
  grid-gap: 8px;
`;

const ExperienceWrapper = styled(RowWrapper)`
  align-content: start;
  grid-gap: 8px;
`;

const InputBox = styled(Input)`
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  background-color: ${prop('theme.gray5')};
  height: 4rem;
  outline: none;
  padding: 2px;
  resize: none;
`;

const ColumnWrapper = styled(Grid)`
  grid-auto-flow: column;
  grid-auto-columns: auto;
`;

const TweetWrapper = styled(ColumnWrapper)`
  justify-content: end;
`;

const TweetButtonWrapper = styled(as(LinkBase)(Grid))`
  padding: 8px;
  grid-auto-flow: column;
  grid-auto-columns: auto;
  grid-gap: 8px;
  background-color: #1da1f2;
  color: #ffffff;
  text-decoration: none;
  align-items: center;
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
`;

const Twitter = styled(FaTwitter)`
  width: 16px;
  height: 16px;
`;

interface State {
  readonly text: string;
  readonly happy: boolean;
}

interface Actions {
  readonly onClickHappy: () => void;
  readonly onClickSad: () => void;
  readonly onChangeText: (text: string) => void;
}

const actions: ActionMap<State, Actions> = {
  onClickHappy: () => () => ({ happy: true }),
  onClickSad: () => () => ({ happy: false }),
  onChangeText: (text: string) => () => ({ text }),
};

export const Feedback = (props: {}) => (
  <ToolbarPopover
    {...props}
    title="Tweet us your feedback."
    button={<HappyToolbarButton />}
    content={
      <Container initialState={{ happy: true, text: '' }} actions={actions}>
        {({ happy, text, onClickHappy, onClickSad, onChangeText }) => (
          <Wrapper>
            <ColumnWrapper>
              <ExperienceWrapper>
                <Text>How was your experience?</Text>
                <ButtonWrapper>
                  <HappyButton onClick={onClickHappy} selected={happy} />
                  <SadButton onClick={onClickSad} selected={!happy} />
                </ButtonWrapper>
              </ExperienceWrapper>
              <ContactWrapper>
                <Text>Other ways to contact us</Text>
                <Link linkColor="primary" href="https://github.com/neo-one-suite/neo-one/issues/new" target="_blank">
                  Submit a bug
                </Link>
                <Link linkColor="primary" href="https://github.com/neo-one-suite/neo-one/issues" target="_blank">
                  Request a missing feature
                </Link>
              </ContactWrapper>
            </ColumnWrapper>
            <BottomWrapper>
              <Text>Tell us why? ({257 - text.length} characters left)</Text>
              <InputBox as="textarea" value={text} onChange={(element: any) => onChangeText(element.target.value)} />
              <TweetWrapper>
                <TweetButtonWrapper
                  href={`https://twitter.com/intent/tweet?hashtags=NEO&ref_src=twsrc%5Etfw&related=twitterapi%2Ctwitter&text=${encodeURIComponent(
                    text,
                  )}&tw_p=tweetbutton&via=neo_one_suite`}
                  target="_blank"
                >
                  <Twitter />
                  Tweet
                </TweetButtonWrapper>
              </TweetWrapper>
            </BottomWrapper>
          </Wrapper>
        )}
      </Container>
    }
  />
);
