
export enum Category {
  FOOD = 'Alimentação',
  TRANSPORT = 'Transporte',
  HOUSING = 'Moradia',
  HEALTH = 'Saúde',
  LEISURE = 'Lazer',
  EDUCATION = 'Educação',
  OTHERS = 'Outros'
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: Category;
  subCategory?: string; // Campo para detalhar 'Outros'
  date: string;
  paid: boolean;
}

export interface Income {
  id: string;
  amount: number;
  month: number; // 0-11
  year: number;
}

export interface AppState {
  expenses: Expense[];
  incomes: Income[];
  initialBalance: number;
  isPremium: boolean;
  theme: 'light' | 'dark';
}

export type ViewType = 'dashboard' | 'reports' | 'settings' | 'income';
