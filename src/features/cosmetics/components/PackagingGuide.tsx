'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { haptic } from '@/lib/haptics';

type PackagingGuideProps = {
  /** 'hint' — маленький «?» рядом с полем; 'row' — строка настроек в профиле. */
  variant?: 'hint' | 'row';
};

/** Значок PAO — открытая баночка с числом месяцев. */
function PaoSymbol() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M9 12h16v11a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" />
        <path d="M11 12l1.5-3h9L23 12" />
      </g>
      <text
        x="17"
        y="21.5"
        textAnchor="middle"
        className="fill-current text-[8px] font-bold"
      >
        12M
      </text>
    </svg>
  );
}

function Section({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="border-t border-icon-bg pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-accent">{icon}</span>}
        <p className="quiet-label">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export function PackagingGuide({ variant = 'hint' }: PackagingGuideProps) {
  const [open, setOpen] = useState(false);

  const trigger =
    variant === 'row' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center justify-between gap-4 text-sm text-text"
      >
        <span>Как читать упаковку</span>
        <span aria-hidden style={{ color: 'var(--chevron)' }}>
          ›
        </span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Как читать упаковку"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
      >
        ?
      </button>
    );

  return (
    <>
      {trigger}

      {open && (
        <Modal
          title="Как читать упаковку"
          onClose={() => {
            haptic('light');
            setOpen(false);
          }}
        >
          <div className="flex flex-col gap-4 pb-2">
            <Section title="Срок после вскрытия (PAO)" icon={<PaoSymbol />}>
              Значок открытой баночки с числом и «M» — например «12M». Столько
              месяцев средство годно после того, как вы его вскрыли. Отсчёт
              идёт с даты первого открытия, а не с покупки.
            </Section>

            <Section title="Годен до (EXP)">
              Дата, до которой средство годно в закрытом виде: «EXP», «BB»,
              «использовать до» или значок песочных часов. На средствах со
              сроком меньше 30 месяцев она есть почти всегда — это самая
              надёжная цифра.
            </Section>

            <Section title="Что берём за срок">
              BBD считает по наименьшему из двух: «Годен до» с упаковки и «дата
              вскрытия + PAO». Так средство не переживёт ни один из сроков.
            </Section>

            <Section title="Батч-код">
              Отдельный буквенно-цифровой код партии — обычно выдавлен или
              напечатан рядом. По нему можно пробить дату производства в онлайн-
              сервисах проверки косметики, если EXP на упаковке нет.
            </Section>

            <Section title="Меняйте вовремя">
              Средства для глаз портятся быстрее: тушь — обычно 3 месяца после
              вскрытия. Если текстура, запах или цвет изменились — заменить,
              даже если срок ещё не вышел.
            </Section>
          </div>
        </Modal>
      )}
    </>
  );
}
