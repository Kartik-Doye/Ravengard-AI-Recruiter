import React from 'react';
import { motion } from 'motion/react';
import styled from 'styled-components';

export function SmoothLoader() {
  return (
    <StyledWrapper>
      <div className="banter-loader">
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .banter-loader {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 72px;
    height: 72px;
    margin-left: -36px;
    margin-top: -36px;
  }

  .banter-loader__box {
    float: left;
    position: relative;
    width: 20px;
    height: 20px;
    margin-right: 6px;
  }

  .banter-loader__box:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: #fff;
  }

  .banter-loader__box:nth-child(3n) {
    margin-right: 0;
    margin-bottom: 6px;
  }

  .banter-loader__box:nth-child(1):before, .banter-loader__box:nth-child(4):before {
    animation: moveLeft 2s ease-in-out infinite;
  }

  .banter-loader__box:nth-child(3):before, .banter-loader__box:nth-child(6):before {
    animation: moveRight 2s ease-in-out infinite;
  }

  @keyframes moveLeft {
    0%, 100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(100%, 0);
    }
  }

  @keyframes moveRight {
    0%, 100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(-100%, 0);
    }
  }
`;
