// tslint:disable no-any
import styled from '@emotion/styled';
import { Box, ButtonBase as ButtonBaseBase, ifProp, Input, Link, LinkBase, prop } from '@neo-one/react-common';
import * as React from 'react';
import { FaTwitter } from 'react-icons/fa';
import { IoMdHappy, IoMdSad } from 'react-icons/io';
import { ToolbarPopover } from './ToolbarPopover';

const { useState, useCallback } = React;

const HappyToolbarButton = styled(IoMdHappy)`
  width: 16px;
  height: 16px;
`;

const ButtonBase = styled(ButtonBaseBase)<{ readonly selected: boolean }>`
  border: 1px solid ${ifProp('selected', prop('theme.accent'), 'transparent')};
  color: ${prop('theme.gray0')};
  width: 32px;
  height: 32px;
  cursor: pointer;
  outline: none;
`;

const HappyButton = ButtonBase.withComponent(IoMdHappy);
const SadButton = ButtonBase.withComponent(IoMdSad);

const Text = styled(Box)`
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
`;

const ButtonWrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  justify-content: start;
`;

const RowWrapper = styled(Box)`
  display: grid;
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

const ColumnWrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: auto;
`;

const TweetWrapper = styled(ColumnWrapper)`
  justify-content: end;
`;

const TweetButtonWrapper = styled(LinkBase)`
  display: grid;
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

export const Feedback = (props: {}) => {
  const [happy, setHappy] = useState(true);
  const [text, setText] = useState('');
  const onClickHappy = useCallback(() => setHappy(true), [setHappy]);
  const onClickSad = useCallback(() => setHappy(false), [setHappy]);
  const onChangeText = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setText(event.currentTarget.value), [
    setText,
  ]);

  return (
    <ToolbarPopover
      {...props}
      title="Tweet us your feedback."
      button={<HappyToolbarButton />}
      content={
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
            <InputBox as="textarea" value={text} onChange={onChangeText} />
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
      }
    />
  );
};
