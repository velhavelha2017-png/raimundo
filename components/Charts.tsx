
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Expense, Category } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface ChartProps {
  expenses: Expense[];
  isDetailed?: boolean;
}

export const CategoryPieChart: React.FC<ChartProps> = ({ expenses }) => {
  const dataMap = expenses.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const data = Object.keys(dataMap).map(key => ({
    name: key,
    value: dataMap[key]
  }));

  if (expenses.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <i className="fas fa-chart-pie text-4xl mb-2 opacity-20"></i>
        <p>Sem dados suficientes</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#ccc'} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MonthlyBarChart: React.FC<ChartProps> = ({ expenses }) => {
  // Mock monthly data grouping for simplicity in this visualization
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const data = months.map((m, i) => ({
    name: m,
    total: expenses.length > 0 ? (Math.random() * 2000 + 500) : 0
  }));

  return (
    <div className="h-80 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip 
             cursor={{fill: 'transparent'}}
             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
