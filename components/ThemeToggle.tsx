/**
 * Theme Toggle Button Component
 *
 * Allows users to switch between dark and light themes
 */

'use client';

import { useState } from 'react';
import { useTheme } from '../lib/theme/theme-context';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const themes = [
    { value: 'dark' as const, label: '深色', icon: '🌙' },
    { value: 'light' as const, label: '浅色', icon: '☀️' },
    { value: 'system' as const, label: '跟随系统', icon: '💻' },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[2];

  return (
    <div className="theme-toggle-wrapper" style={{ position: 'relative' }}>
      <button
        className="theme-toggle-button"
        onClick={() => setShowMenu(!showMenu)}
        title={`当前主题: ${currentTheme.label}`}
      >
        <span className="theme-icon">{currentTheme.icon}</span>
      </button>

      {showMenu && (
        <>
          <div
            className="theme-overlay"
            onClick={() => setShowMenu(false)}
          />
          <div className="theme-menu">
            {themes.map((t) => (
              <button
                key={t.value}
                className={`theme-option ${theme === t.value ? 'active' : ''}`}
                onClick={() => {
                  setTheme(t.value);
                  setShowMenu(false);
                }}
              >
                <span className="theme-option-icon">{t.icon}</span>
                <span className="theme-option-label">{t.label}</span>
                {theme === t.value && (
                  <span className="theme-option-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ThemeToggle;
