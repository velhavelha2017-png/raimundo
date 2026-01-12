
import { GoogleGenAI } from "@google/genai";
import { Expense, Income } from "../types";

export const getFinancialAdvice = async (expenses: Expense[], incomes: Income[], balance: number) => {
  // Defensive check for the environment variable to prevent uncaught reference errors
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  if (!apiKey) {
    return "Chave de API não encontrada. Por favor, verifique as configurações do ambiente.";
  }

  const summary = expenses.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);

  const prompt = `
    Como um consultor financeiro especialista, analise os seguintes dados financeiros do usuário:
    - Saldo Inicial: R$ ${balance}
    - Rendas Extras: R$ ${totalIncomes}
    - Gasto Total: R$ ${totalSpent}
    - Gastos por Categoria: ${JSON.stringify(summary)}

    Forneça 3 dicas curtas e práticas em português (máximo 50 palavras por dica) para melhorar a saúde financeira deste usuário.
    Seja motivador e direto.
  `;

  try {
    // Initializing right before the call as per SDK best practices for web environments
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível obter uma resposta da IA.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Houve um erro ao processar seus insights financeiros. Verifique sua conexão ou chave de API.";
  }
};
