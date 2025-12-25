export interface Persona {
  id: string;
  name: string;
  subtitle: string;
  welcomeTemplate: (activeTasks: number, eventCount: number) => string;
  loadingMessage: string;
  confirmButtonText: (itemCount: number) => string;
  saveSummary: string;
}

export const personas: Record<string, Persona> = {
  atlas: {
    id: 'atlas',
    name: 'אטלס',
    subtitle: 'ראש המטה שלך',
    welcomeTemplate: (activeTasks, eventCount) =>
      `ערב טוב. אני אטלס, ראש המטה שלך.\n\nאני רואה **${activeTasks} משימות פעילות** ו-**${eventCount} אירועים** ביומן של מחר. איך אפשר לעזור?`,
    loadingMessage: `ערב טוב. אני אטלס, ראש המטה שלך. טוען את המשימות והיומן שלך...`,
    confirmButtonText: (itemCount) => `אטלס הכין תכנית עם ${itemCount} פריטים`,
    saveSummary: 'תכנון עם אטלס',
  },
  barbara: {
    id: 'barbara',
    name: 'ברברה',
    subtitle: 'ראשת המטה שלך',
    welcomeTemplate: (activeTasks, eventCount) =>
      `ערב טוב. ברברה כאן.\n\nאז יש לנו **${activeTasks} משימות** ו-**${eventCount} אירועים** למחר. בוא נעשה סדר בבלגן הזה.`,
    loadingMessage: `ערב טוב. ברברה כאן. רגע, טוענת את כל מה שצריך...`,
    confirmButtonText: (itemCount) => `ברברה הכינה תכנית עם ${itemCount} פריטים`,
    saveSummary: 'תכנון עם ברברה',
  },
};

export const defaultPersonaId = 'atlas';
