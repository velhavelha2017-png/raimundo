
import React, { useState, useEffect } from 'react';
import { 
  AppState, 
  Expense, 
  Income, 
  Category, 
  ViewType 
} from './types';
import { CATEGORY_ICONS, CATEGORY_COLORS, MONTHS } from './constants';
import { CategoryPieChart, MonthlyBarChart } from './components/Charts';
import { AdPlaceholder } from './components/AdPlaceholder';
import { getFinancialAdvice } from './services/geminiService';

const STORAGE_KEY = 'finance_master_state';

const App: React.FC = () => {
  // State Initialization
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        expenses: [],
        incomes: [],
        initialBalance: 0,
        isPremium: false,
        theme: 'light'
      };
    } catch (e) {
      return {
        expenses: [],
        incomes: [],
        initialBalance: 0,
        isPremium: false,
        theme: 'light'
      };
    }
  });

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isIncomeModalOpen, setIncomeModalOpen] = useState(false);
  const [isBalanceEditOpen, setBalanceEditOpen] = useState(false);
  
  // Modal internal state for 'Others' category
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.FOOD);

  // Ad states
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showRewarded, setShowRewarded] = useState(false);
  const [detailedReportsUnlocked, setDetailedReportsUnlocked] = useState(false);

  // AI Advice state
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const handleSaveExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const expenseData: Partial<Expense> = {
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string) || 0,
      category: formData.get('category') as Category,
      subCategory: formData.get('subCategory') as string || undefined,
      date: formData.get('date') as string,
    };

    if (editingExpense) {
      // Update existing
      setState(prev => ({
        ...prev,
        expenses: prev.expenses.map(exp => exp.id === editingExpense.id ? { ...exp, ...expenseData } : exp)
      }));
    } else {
      // Add new
      const newExpense: Expense = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        description: expenseData.description || 'Nova Despesa',
        amount: expenseData.amount || 0,
        category: expenseData.category || Category.OTHERS,
        subCategory: expenseData.subCategory,
        date: expenseData.date || new Date().toISOString().split('T')[0],
        paid: false
      };
      setState(prev => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
      
      if (!state.isPremium) {
        setTimeout(() => setShowInterstitial(true), 300);
      }
    }
    
    setExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setSelectedCategory(expense.category);
    setExpenseModalOpen(true);
  };

  const handleMonthPaidAction = () => {
    const allPaid = state.expenses.length > 0 && state.expenses.every(e => e.paid);
    
    if (!allPaid) {
      alert("Para concluir o mês, todas as despesas atuais devem estar marcadas como pagas.");
      return;
    }

    if (confirm("Deseja marcar o mês como concluído e gerar as despesas para o próximo mês?")) {
      const nextMonthExpenses = state.expenses.map(e => {
        const date = new Date(e.date);
        date.setMonth(date.getMonth() + 1);
        return {
          ...e,
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
          date: date.toISOString().split('T')[0],
          paid: false
        };
      });

      setState(prev => ({
        ...prev,
        expenses: [...nextMonthExpenses, ...prev.expenses]
      }));
      
      alert("Sucesso! As despesas foram replicadas para o próximo mês com as datas atualizadas.");
    }
  };

  const addIncome = (amount: number, month: number) => {
    const newIncome: Income = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      amount,
      month,
      year: new Date().getFullYear()
    };
    setState(prev => ({ ...prev, incomes: [...prev.incomes, newIncome] }));
    setIncomeModalOpen(false);
  };

  const toggleExpensePaid = (id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, paid: !e.paid } : e)
    }));
  };

  const deleteExpense = (id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
  };

  const updateBalance = (newBalance: number) => {
    setState(prev => ({ ...prev, initialBalance: newBalance }));
    setBalanceEditOpen(false);
  };

  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncomes = state.incomes.reduce((sum, i) => sum + i.amount, 0);
  const currentBalance = state.initialBalance + totalIncomes - totalExpenses;

  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const result = await getFinancialAdvice(state.expenses, state.incomes, state.initialBalance);
      setAdvice(result);
    } catch (e) {
      setAdvice("Não foi possível carregar os insights.");
    } finally {
      setLoadingAdvice(false);
    }
  };

  const handleUnlockDetailed = () => {
    if (state.isPremium) {
      setDetailedReportsUnlocked(true);
    } else {
      setShowRewarded(true);
    }
  };

  const allExpensesPaid = state.expenses.length > 0 && state.expenses.every(e => e.paid);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200 text-gray-900 dark:text-gray-100 pb-20 md:pb-0">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[40]" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 z-[50] transform transition-transform duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <i className="fas fa-wallet text-xl"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight">FinanceMaster</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'fa-home' },
              { id: 'income', label: 'Renda Extra', icon: 'fa-plus-circle' },
              { id: 'reports', label: 'Relatórios', icon: 'fa-chart-bar' },
              { id: 'settings', label: 'Configurações', icon: 'fa-cog' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setCurrentView(item.id as ViewType); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400'}`}
              >
                <i className={`fas ${item.icon} w-5`}></i>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">
            {!state.isPremium && (
              <button 
                onClick={() => setState(prev => ({ ...prev, isPremium: true }))}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
              >
                <i className="fas fa-crown text-yellow-200"></i>
                Seja Premium
              </button>
            )}
            {state.isPremium && (
              <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2">
                <i className="fas fa-check-circle"></i> Conta Premium Ativa
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <i className="fas fa-bars"></i>
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <i className={`fas ${state.theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
          </div>
        </header>

        {currentView === 'dashboard' && (
          <div className="animate-fadeIn">
            {/* Balance Card */}
            <div className="bg-blue-600 rounded-3xl p-8 text-white mb-8 shadow-2xl shadow-blue-500/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <i className="fas fa-wallet text-9xl"></i>
              </div>
              
              <div className="relative z-10">
                <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">Saldo Total</p>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-4xl font-extrabold">
                    {currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </h2>
                  <button 
                    onClick={() => setBalanceEditOpen(true)}
                    className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors"
                  >
                    <i className="fas fa-pen text-xs"></i>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <p className="text-xs text-blue-100 mb-1">Entradas</p>
                    <p className="text-xl font-bold">+ {totalIncomes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <p className="text-xs text-blue-100 mb-1">Saídas</p>
                    <p className="text-xl font-bold">- {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Month Paid Banner - Prominent CTA */}
            {allExpensesPaid && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between animate-fadeIn shadow-xl shadow-green-500/20 border border-green-400/30">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                    <i className="fas fa-check-double"></i>
                  </div>
                  <div>
                    <p className="font-bold text-lg">Todas as contas pagas!</p>
                    <p className="text-sm opacity-90">Deseja automatizar o próximo mês com as mesmas despesas?</p>
                  </div>
                </div>
                <button 
                  onClick={handleMonthPaidAction}
                  className="bg-white text-green-600 px-6 py-3 rounded-2xl font-bold hover:bg-green-50 transition-all active:scale-95 shadow-lg"
                >
                  Concluir Mês
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Category Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                   <i className="fas fa-chart-pie text-blue-500"></i>
                   Gastos por Categoria
                </h3>
                <CategoryPieChart expenses={state.expenses} />
              </div>

              {/* AI Insights */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <i className="fas fa-brain text-purple-500"></i>
                    FinanceMaster AI
                  </h3>
                  <button 
                    onClick={fetchAdvice}
                    disabled={loadingAdvice}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {loadingAdvice ? 'Processando...' : 'Obter Dicas'}
                  </button>
                </div>
                
                <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 text-sm leading-relaxed overflow-y-auto max-h-48 no-scrollbar">
                  {advice ? (
                    <div className="space-y-3">
                      {advice.split('\n').filter(Boolean).map((line, i) => (
                        <p key={i} className="flex gap-2">
                          <span className="text-purple-500 font-bold">•</span>
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                      <i className="fas fa-robot text-3xl mb-2 opacity-20"></i>
                      <p>Clique em "Obter Dicas" para análise inteligente dos seus gastos.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Expenses List */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Minhas Despesas</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingExpense(null); setSelectedCategory(Category.FOOD); setExpenseModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
                  >
                    <i className="fas fa-plus mr-2"></i> Adicionar
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {state.expenses.length > 0 ? (
                  state.expenses.map(expense => (
                    <div 
                      key={expense.id} 
                      className={`group flex items-center justify-between p-4 rounded-2xl transition-all border ${
                        expense.paid 
                        ? 'bg-gray-50/50 dark:bg-gray-700/20 border-gray-100 dark:border-gray-700 opacity-60' 
                        : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <input 
                          type="checkbox" 
                          checked={expense.paid}
                          onChange={() => toggleExpensePaid(expense.id)}
                          className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 transition-opacity ${expense.paid ? 'opacity-50' : ''}`}
                          style={{ backgroundColor: CATEGORY_COLORS[expense.category] }}
                        >
                          {CATEGORY_ICONS[expense.category]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                             <p className={`font-bold text-sm truncate ${expense.paid ? 'line-through text-gray-500' : ''}`}>
                               {expense.description}
                             </p>
                             {expense.subCategory && (
                               <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-400 font-medium shrink-0">
                                 {expense.subCategory}
                               </span>
                             )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{expense.category} • {new Date(expense.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4 shrink-0">
                        <p className={`font-bold transition-all ${expense.paid ? 'text-gray-400 line-through' : 'text-red-500'}`}>
                          - {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => openEditModal(expense)}
                            className="w-8 h-8 opacity-0 group-hover:opacity-100 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          <button 
                            onClick={() => deleteExpense(expense.id)}
                            className="w-8 h-8 opacity-0 group-hover:opacity-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <i className="fas fa-trash-alt text-sm"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-gray-400">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-receipt text-3xl opacity-20"></i>
                    </div>
                    <p className="font-medium">Nenhuma despesa para mostrar.</p>
                    <p className="text-xs">Comece adicionando seus gastos fixos e variáveis.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'reports' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-8 text-center md:text-left">Análise Financeira</h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
              <h3 className="font-bold text-lg mb-2">Fluxo de Caixa Mensal</h3>
              <p className="text-sm text-gray-500 mb-6">Comparativo dos últimos 6 meses</p>
              <MonthlyBarChart expenses={state.expenses} />
            </div>

            <div className="relative">
              {!detailedReportsUnlocked && !state.isPremium && (
                <div className="absolute inset-0 z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[4px] rounded-3xl flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center text-amber-600 dark:text-amber-400 text-3xl mb-4 shadow-inner">
                    <i className="fas fa-lock"></i>
                  </div>
                  <h4 className="text-2xl font-bold mb-2">Relatórios Detalhados</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                    Assista a um breve anúncio para desbloquear a análise detalhada por categoria e tendência.
                  </p>
                  <button 
                    onClick={handleUnlockDetailed}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/30 active:scale-95"
                  >
                    Desbloquear Agora
                  </button>
                </div>
              )}

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${!detailedReportsUnlocked && !state.isPremium ? 'opacity-30 select-none grayscale' : ''}`}>
                 <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold mb-4">Top Categorias (Valor)</h3>
                    <div className="space-y-4">
                      {Object.entries(state.expenses.reduce((acc: any, e) => {
                        acc[e.category] = (acc[e.category] || 0) + e.amount;
                        return acc;
                      }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([cat, val]: any) => (
                        <div key={cat} className="flex items-center justify-between mb-3 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat as Category] }}></div>
                            <span className="font-medium">{cat}</span>
                          </div>
                          <span className="font-bold">{val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      ))}
                    </div>
                 </div>
                 <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold mb-4">Economia Estimada</h3>
                    <div className="flex flex-col items-center justify-center h-full py-8">
                        <div className="relative">
                          <div className="text-6xl font-black text-green-500 mb-2">
                             {((totalIncomes - totalExpenses) / (totalIncomes || 1) * 100).toFixed(0)}%
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">do seu orçamento livre este mês</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'income' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-8">Renda Extra</h2>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-3xl flex items-center justify-center text-4xl shadow-inner">
                  <i className="fas fa-hand-holding-usd"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Ganhos Adicionais</h3>
                  <p className="text-sm text-gray-500">Registre entradas que não fazem parte do seu salário base.</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIncomeModalOpen(true)}
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-green-500/20 active:scale-95 text-lg"
              >
                + Adicionar Nova Renda
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-gray-500 uppercase tracking-widest text-[10px] ml-4">Histórico de Recebimentos</h4>
              {state.incomes.map(income => (
                <div key={income.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center text-xl">
                      <i className="fas fa-arrow-trend-up"></i>
                    </div>
                    <div>
                      <p className="font-bold">Entrada de Renda</p>
                      <p className="text-xs text-gray-500">{MONTHS[income.month]} de {income.year}</p>
                    </div>
                  </div>
                  <p className="font-black text-green-600 text-lg">
                    + {income.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              ))}
              {state.incomes.length === 0 && (
                <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
                  <i className="fas fa-money-bill-wave text-4xl mb-4 opacity-10"></i>
                  <p className="italic">Nada por aqui ainda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'settings' && (
          <div className="animate-fadeIn max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center md:text-left">Configurações</h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
               <div className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xl">
                       <i className={`fas ${state.theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i>
                    </div>
                    <div>
                       <p className="font-bold">Aparência do App</p>
                       <p className="text-xs text-gray-500">Alternar entre modo claro e escuro</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className={`w-14 h-8 rounded-full transition-all relative ${state.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${state.theme === 'dark' ? 'translate-x-7' : 'translate-x-1'} shadow-md`} />
                  </button>
               </div>

               <div className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center text-xl">
                       <i className="fas fa-crown"></i>
                    </div>
                    <div>
                       <p className="font-bold">Assinatura Premium</p>
                       <p className="text-xs text-gray-500">Remove todos os anúncios do aplicativo</p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${state.isPremium ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                    {state.isPremium ? 'Premium Ativo' : 'Versão Grátis'}
                  </div>
               </div>

               <div 
                 onClick={() => {
                   if (confirm('ATENÇÃO: Deseja apagar todos os seus dados permanentemente? Esta ação não pode ser desfeita.')) {
                     setState({
                       expenses: [],
                       incomes: [],
                       initialBalance: 0,
                       isPremium: false,
                       theme: 'light'
                     });
                     localStorage.removeItem(STORAGE_KEY);
                   }
                 }}
                 className="p-6 flex items-center gap-4 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer group transition-colors"
               >
                  <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                     <i className="fas fa-triangle-exclamation"></i>
                  </div>
                  <div>
                     <p className="font-bold text-red-600">Limpar Tudo</p>
                     <p className="text-xs text-gray-500">Apagar histórico e redefinir o app</p>
                  </div>
               </div>
            </div>

            <div className="mt-12 text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
               FinanceMaster Pro v1.0.0 • 2024
            </div>
          </div>
        )}
      </main>

      {/* Ad Banners */}
      <AdPlaceholder 
        type="banner" 
        isVisible={!state.isPremium} 
        isPremium={state.isPremium}
      />

      {/* Interstitial Ad */}
      <AdPlaceholder 
        type="interstitial" 
        isVisible={showInterstitial} 
        onClose={() => setShowInterstitial(false)}
        isPremium={state.isPremium}
      />

      {/* Rewarded Ad */}
      <AdPlaceholder 
        type="rewarded" 
        isVisible={showRewarded} 
        onClose={() => setShowRewarded(false)}
        onReward={() => {
          setDetailedReportsUnlocked(true);
          setShowRewarded(false);
        }}
        isPremium={state.isPremium}
      />

      {/* Modals */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-3xl md:rounded-3xl p-8 animate-slideUp shadow-2xl">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black tracking-tight">{editingExpense ? 'Editar Gasto' : 'Novo Gasto'}</h2>
                <button onClick={() => { setExpenseModalOpen(false); setEditingExpense(null); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400">
                  <i className="fas fa-times"></i>
                </button>
             </div>
             
             <form onSubmit={handleSaveExpense} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descrição da Despesa</label>
                  <input required name="description" defaultValue={editingExpense?.description || ''} type="text" placeholder="Ex: Conta de Luz" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor (R$)</label>
                     <input required name="amount" defaultValue={editingExpense?.amount || ''} type="number" step="0.01" placeholder="0,00" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Data de Vencimento</label>
                     <input required name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Categoria Principal</label>
                  <div className="relative">
                    <select 
                      name="category" 
                      defaultValue={editingExpense?.category || Category.FOOD} 
                      onChange={(e) => setSelectedCategory(e.target.value as Category)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                    >
                       {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                       <i className="fas fa-chevron-down"></i>
                    </div>
                  </div>
                </div>

                {(selectedCategory === Category.OTHERS || editingExpense?.category === Category.OTHERS) && (
                  <div className="animate-fadeIn">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Especifique o Gasto</label>
                    <input name="subCategory" defaultValue={editingExpense?.subCategory || ''} type="text" placeholder="Ex: Assinatura Netflix" className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                )}

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 mt-4 transition-all active:scale-95 text-lg">
                  {editingExpense ? 'Salvar Alterações' : 'Confirmar Gasto'}
                </button>
             </form>
          </div>
        </div>
      )}

      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-3xl md:rounded-3xl p-8 animate-slideUp shadow-2xl">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black tracking-tight">Renda Extra</h2>
                <button onClick={() => setIncomeModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                  <i className="fas fa-times"></i>
                </button>
             </div>
             
             <form onSubmit={(e) => {
               e.preventDefault();
               const formData = new FormData(e.currentTarget);
               addIncome(
                 parseFloat(formData.get('amount') as string) || 0,
                 parseInt(formData.get('month') as string)
               );
             }} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor Recebido (R$)</label>
                  <input required name="amount" type="number" step="0.01" placeholder="0,00" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mês do Recebimento</label>
                  <div className="relative">
                    <select name="month" defaultValue={new Date().getMonth()} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
                       {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                       <i className="fas fa-chevron-down"></i>
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-green-500/20 mt-4 transition-all active:scale-95 text-lg">
                  Confirmar Renda
                </button>
             </form>
          </div>
        </div>
      )}

      {isBalanceEditOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-8 animate-fadeIn shadow-2xl">
             <h2 className="text-xl font-black mb-6 tracking-tight">Saldo da Conta</h2>
             <div className="space-y-4">
               <input 
                 autoFocus
                 type="number" 
                 id="balance-input"
                 defaultValue={state.initialBalance} 
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') updateBalance(parseFloat(e.currentTarget.value) || 0);
                 }}
                 className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 focus:ring-2 focus:ring-blue-500 outline-none text-2xl font-black text-center"
               />
               <p className="text-xs text-gray-500 text-center">Informe o valor atual disponível em sua conta.</p>
             </div>
             <div className="flex gap-4 mt-8">
                <button onClick={() => setBalanceEditOpen(false)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-colors">Voltar</button>
                <button onClick={() => {
                  const input = document.getElementById('balance-input') as HTMLInputElement;
                  updateBalance(parseFloat(input.value) || 0);
                }} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95">Salvar</button>
             </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-40">
        {[
          { id: 'dashboard', icon: 'fa-home' },
          { id: 'income', icon: 'fa-wallet' },
          { id: 'reports', icon: 'fa-chart-pie' },
          { id: 'settings', icon: 'fa-user-gear' },
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setCurrentView(item.id as ViewType)}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${currentView === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40 -translate-y-3 scale-110' : 'text-gray-400 hover:text-blue-500'}`}
          >
            <i className={`fas ${item.icon} text-xl`}></i>
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
