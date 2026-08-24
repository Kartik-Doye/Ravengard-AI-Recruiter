import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import styled from 'styled-components';

const ToggleWrapper = styled.div`
  /* custom-toggle styles */
  .switch {
    font-size: 17px;
    position: relative;
    display: inline-block;
    width: 3.5em;
    height: 2em;
  }

  /* Hide default HTML checkbox */
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  /* The slider */
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #333;
    transition: .4s;
    border-radius: 30px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 1.4em;
    width: 1.4em;
    border-radius: 20px;
    left: 0.3em;
    bottom: 0.3em;
    background-color: #fff;
    transition: .4s;
  }

  input:checked + .slider {
    background-color: #f0f0f0;
  }

  input:checked + .slider:before {
    transform: translateX(1.5em);
    background-color: #333;
  }
`;

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <ToggleWrapper>
      <label className="switch" aria-label="Toggle theme">
        <input type="checkbox" checked={theme === 'light'} onChange={toggleTheme} />
        <span className="slider"></span>
      </label>
    </ToggleWrapper>
  );
}
