import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle({ size = 'md' }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'} />;

  const isDark = theme === 'dark';
  const sizeClass = size === 'sm' ? 'p-1.5 w-7 h-7' : 'p-2 w-9 h-9';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`
        ${sizeClass} rounded-lg
        bg-bg-surface2 border border-border-default
        text-text-secondary hover:text-text-primary
        hover:border-border-strong hover:shadow-sm
        transition-all duration-150
        flex items-center justify-center
        group relative outline-none
      `}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className={`
        ${iconSize} transition-all duration-200
        ${isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0 absolute'}
      `}>
        <SunIcon />
      </span>
      <span className={`
        ${iconSize} transition-all duration-200
        ${!isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0 absolute'}
      `}>
        <MoonIcon />
      </span>
    </button>
  );
}
