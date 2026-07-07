'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type DesignStyleId,
  isDesignStyleId,
  STYLE_STORAGE_KEY,
} from './design-styles';

type StyleContextValue = {
  designStyle: DesignStyleId;
  setDesignStyle: (style: DesignStyleId) => void;
};

const StyleContext = createContext<StyleContextValue | null>(null);

function readStoredStyle(): DesignStyleId {
  if (typeof window === 'undefined') return 'warm';
  const stored = localStorage.getItem(STYLE_STORAGE_KEY);
  return isDesignStyleId(stored) ? stored : 'warm';
}

function applyDesignStyle(style: DesignStyleId) {
  document.documentElement.dataset.style = style;
}

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const [designStyle, setDesignStyleState] = useState<DesignStyleId>(readStoredStyle);

  const setDesignStyle = useCallback((style: DesignStyleId) => {
    setDesignStyleState(style);
    localStorage.setItem(STYLE_STORAGE_KEY, style);
    applyDesignStyle(style);
  }, []);

  useEffect(() => {
    applyDesignStyle(designStyle);
  }, [designStyle]);

  const value = useMemo(
    () => ({ designStyle, setDesignStyle }),
    [designStyle, setDesignStyle],
  );

  return (
    <StyleContext.Provider value={value}>{children}</StyleContext.Provider>
  );
}

export function useDesignStyle() {
  const context = useContext(StyleContext);
  if (!context) {
    throw new Error('useDesignStyle must be used within StyleProvider');
  }
  return context;
}
