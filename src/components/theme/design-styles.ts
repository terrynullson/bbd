export const STYLE_STORAGE_KEY = 'bbd-design-style';

export type DesignStyleId = 'warm' | 'pulse' | 'riot';

export type DesignStyleOption = {
  id: DesignStyleId;
  label: string;
  description: string;
  preview: {
    warm: string;
    accent: string;
    surface: string;
  };
};

export const DESIGN_STYLES: DesignStyleOption[] = [
  {
    id: 'warm',
    label: 'Тёплый',
    description: 'Мягкий лист, терракот и serif-заголовки',
    preview: {
      warm: '#6b5144',
      accent: '#c17d65',
      surface: '#ffffff',
    },
  },
  {
    id: 'pulse',
    label: 'Импульс',
    description: 'Холодная сетка, cyan-акцент и плоский dock',
    preview: {
      warm: '#07090d',
      accent: '#38bdf8',
      surface: '#0f1218',
    },
  },
  {
    id: 'riot',
    label: 'Бунт',
    description: 'Неон, кислотный жёлтый и злой контраст',
    preview: {
      warm: '#0a0a0a',
      accent: '#ff1f6b',
      surface: '#e8ff00',
    },
  },
];

export function isDesignStyleId(value: string | null): value is DesignStyleId {
  return value === 'warm' || value === 'pulse' || value === 'riot';
}
