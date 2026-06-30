"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Droplet, Sparkles, AlertCircle } from 'lucide-react';

// --- ШАГ 1 & 2: ТИПЫ ДАННЫХ И КОНФИГУРАЦИЯ ---
// В реальном Next.js проекте это было бы в types/index.ts
// interface CosmeticItem {
//   id: string;
//   name: string;
//   brand: string;
//   barcode?: string;
//   paoMonths: number;
//   openedAt: string; // ISO date
//   status: 'fresh' | 'expiring' | 'expired';
// }

// Дизайн-токены (Bold & Cute) интегрированы прямо в Tailwind классы:
// Фон: #FDFBF7 (Сливочный)
// Карточки: #E9F5E9 (Матча) или #F4EEFF (Лаванда)
// Акцент (Кнопка): #FF4DEB (Неоновый розовый) с тенью rgba(255,77,235,0.4)
// Опасность: #FF3366 (Красный)

// --- ШАГ 3: ЛОГИКА ДАННЫХ (ХУК) ---
const calculateStatus = (openedAt, paoMonths) => {
  const openDate = new Date(openedAt);
  const expirationDate = new Date(openDate.setMonth(openDate.getMonth() + paoMonths));
  const today = new Date();
  
  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  
  // force rebuild

  if (diffDays <= 0) return 'expired';
  if (diffDays <= 30) return 'expiring';
  return 'fresh';
};

const useCosmetics = () => {
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Читаем из LocalStorage при загрузке
  useEffect(() => {
    const saved = localStorage.getItem('gde-moy-krem-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Пересчитываем статусы при каждой загрузке
        const updated = parsed.map(item => ({
          ...item,
          status: calculateStatus(item.openedAt, item.paoMonths)
        }));
        setItems(updated);
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Сохраняем при изменении
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('gde-moy-krem-data', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (newItem) => {
    const itemWithStatus = {
      ...newItem,
      id: Date.now().toString(),
      status: calculateStatus(newItem.openedAt, newItem.paoMonths)
    };
    setItems(prev => [itemWithStatus, ...prev]);
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return { items, addItem, removeItem, isLoaded };
};

// --- ШАГ 4: ГЛАВНЫЙ ЭКРАН (UI) ---

export default function App() {
  const { items, addItem, removeItem, isLoaded } = useCosmetics();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Форма добавления
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newPao, setNewPao] = useState(12);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName) return;
    
    addItem({
      name: newName,
      brand: newBrand || 'Неизвестный бренд',
      paoMonths: newPao,
      openedAt: new Date().toISOString(),
    });
    
    setNewName('');
    setNewBrand('');
    setNewPao(12);
    setIsModalOpen(false);
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">Загрузка...</div>;

  const sortedItems = [...items].sort((a, b) => {
    // Сначала просроченные, потом истекающие, потом свежие
    const order = { expired: 1, expiring: 2, fresh: 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 font-sans pb-24 selection:bg-[#FF4DEB] selection:text-white">
      {/* Импорт шрифта для "Bold & Cute" вайба */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
      `}} />

      {/* Шапка */}
      <header className="p-6 pt-10 sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-md z-10">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Где Мой <span className="text-[#FF4DEB]">Крем?</span> ✨
        </h1>
        <p className="text-slate-500 font-medium mt-1">Твоя бьюти-база</p>
      </header>

      <main className="px-6">
        {items.length === 0 ? (
          // ПУСТОЙ СТЕЙТ
          <div className="flex flex-col items-center justify-center mt-20 text-center animate-in fade-in duration-500">
            <div className="w-32 h-32 bg-[#F4EEFF] rounded-[32px] rotate-3 flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(150,130,255,0.15)]">
              <Sparkles className="w-16 h-16 text-[#FF4DEB]" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-800">Тут пока пусто 🥺</h2>
            <p className="text-slate-500 font-medium mb-12 max-w-[250px]">
              Добавь свою первую баночку, чтобы защитить кожу от просрочки.
            </p>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="relative group bg-[#FF4DEB] text-white px-8 py-5 rounded-[32px] text-xl font-bold w-full max-w-sm active:scale-95 transition-all duration-200 shadow-[0_12px_32px_rgba(255,77,235,0.4)]"
            >
              <div className="absolute inset-0 rounded-[32px] bg-[#FF4DEB] animate-ping opacity-20 group-hover:opacity-40"></div>
              <span className="relative flex items-center justify-center gap-2">
                <Plus className="w-6 h-6 stroke-[3]" /> Добавить баночку
              </span>
            </button>
          </div>
        ) : (
          // ДАШБОРД (СПИСОК ТОВАРОВ)
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
            {sortedItems.map(item => (
              <div 
                key={item.id} 
                className={`relative p-5 rounded-[24px] transition-all flex justify-between items-center group
                  ${item.status === 'fresh' ? 'bg-[#E9F5E9] shadow-[0_8px_24px_rgba(0,230,118,0.15)]' : ''}
                  ${item.status === 'expiring' ? 'bg-[#FFF9C4] shadow-[0_8px_24px_rgba(255,234,0,0.15)]' : ''}
                  ${item.status === 'expired' ? 'bg-[#FFEBEE] shadow-[0_8px_24px_rgba(255,51,102,0.15)]' : ''}
                `}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl" role="img" aria-label="status">
                      {item.status === 'fresh' ? '💅' : item.status === 'expiring' ? '🥺' : '🗑️'}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1">
                      <Droplet className="w-3 h-3" /> {item.brand}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold leading-tight mb-2 text-slate-800 pr-4">{item.name}</h3>
                  <div className="flex items-center gap-2 text-sm font-semibold opacity-70">
                    <Calendar className="w-4 h-4" />
                    Вскрыто: {new Date(item.openedAt).toLocaleDateString('ru-RU')}
                    <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs ml-2">
                      {item.paoMonths}M
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => removeItem(item.id)}
                  className="w-12 h-12 shrink-0 bg-white/40 hover:bg-[#FF3366] hover:text-white rounded-[18px] flex items-center justify-center transition-colors active:scale-90 text-slate-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                {item.status === 'expired' && (
                  <button className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#FF4DEB] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(255,77,235,0.4)] hover:scale-105 transition-transform">
                    Купить замену 🛍️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Кнопка добавления (если список не пуст) */}
      {items.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-6 z-20 flex justify-center pointer-events-none">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="pointer-events-auto bg-[#2E3CFF] text-white p-4 rounded-[24px] shadow-[0_12px_24px_rgba(46,60,255,0.4)] active:scale-90 transition-transform flex items-center justify-center gap-2"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </div>
      )}

      {/* МОДАЛКА ДОБАВЛЕНИЯ (Ручной ввод) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#FDFBF7]/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-[0_24px_48px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Новая баночка 🧴</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full active:scale-90">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2 pl-2">Бренд (опционально)</label>
                <input 
                  type="text" 
                  placeholder="Например, CeraVe" 
                  value={newBrand}
                  onChange={e => setNewBrand(e.target.value)}
                  className="w-full bg-[#FDFBF7] border-2 border-[#E9F5E9] p-4 rounded-[20px] font-semibold outline-none focus:border-[#FF4DEB] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2 pl-2">Название продукта*</label>
                <input 
                  type="text" 
                  required
                  placeholder="Увлажняющий лосьон" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-[#FDFBF7] border-2 border-[#E9F5E9] p-4 rounded-[20px] font-semibold outline-none focus:border-[#FF4DEB] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2 pl-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Срок после вскрытия (PAO)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 12, 24].map(months => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setNewPao(months)}
                      className={`p-3 rounded-[16px] font-bold border-2 transition-all ${
                        newPao === months 
                          ? 'border-[#2E3CFF] bg-[#2E3CFF]/10 text-[#2E3CFF]' 
                          : 'border-[#E9F5E9] bg-[#FDFBF7] text-slate-400 hover:border-[#2E3CFF]/30'
                      }`}
                    >
                      {months}M
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="mt-4 bg-[#FF4DEB] text-white py-4 rounded-[24px] text-lg font-bold shadow-[0_8px_24px_rgba(255,77,235,0.4)] active:scale-95 transition-transform"
              >
                Сохранить ✨
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}