import React from 'react';
import styled from 'styled-components';

const CubeWrapper = styled.div`
  .cube-loader {
    width: 73px;
    height: 73px;
    position: relative;
    transform: rotateZ(45deg);
  }

  .cube {
    position: relative;
    transform: rotateZ(45deg);
    width: 50%;
    height: 50%;
    float: left;
    transform: scale(1.1);
  }

  .cube:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    animation: cube-loader 2.76s infinite linear both;
    transform-origin: 100% 100%;
  }

  .cube-loader .cube2 {
    transform: scale(1.1) rotateZ(90deg);
  }

  .cube-loader .cube3 {
    transform: scale(1.1) rotateZ(180deg);
  }

  .cube-loader .cube4 {
    transform: scale(1.1) rotateZ(270deg);
  }

  .cube-loader .cube2:before {
    animation-delay: 0.35s;
  }

  .cube-loader .cube3:before {
    animation-delay: 0.69s;
  }

  .cube-loader .cube4:before {
    animation-delay: 1.04s;
  }

  @keyframes cube-loader {
    0%, 10% {
      transform: perspective(136px) rotateX(-180deg);
      opacity: 0;
    }
    25%, 75% {
      transform: perspective(136px) rotateX(0deg);
      opacity: 1;
    }
    90%, 100% {
      transform: perspective(136px) rotateY(180deg);
      opacity: 0;
    }
  }
`;

export function CubeLoader() {
  return (
    <CubeWrapper>
      <div className="cube-loader" aria-label="Loading..." role="status">
        <div className="cube cube1"></div>
        <div className="cube cube2"></div>
        <div className="cube cube4"></div>
        <div className="cube cube3"></div>
      </div>
    </CubeWrapper>
  );
}
