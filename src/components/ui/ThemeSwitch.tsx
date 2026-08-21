import React from 'react';

export function ThemeSwitch() {
  return (
    <div className="custom-toggle-wrapper">
      <div className="custom-toggle">
        <input type="checkbox" id="theme-toggle-c3d" />
        <label htmlFor="theme-toggle-c3d">Toggle theme</label>
      </div>
    </div>
  );
}
