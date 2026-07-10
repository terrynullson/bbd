import type { ReactNode } from 'react';

/** Золотые капители над полем формы — единый стиль «тихой роскоши». */
export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="quiet-label mb-2 block">{children}</label>;
}
