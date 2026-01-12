
import React from 'react';
import { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.FOOD]: '#EF4444', // red-500
  [Category.TRANSPORT]: '#3B82F6', // blue-500
  [Category.HOUSING]: '#10B981', // emerald-500
  [Category.HEALTH]: '#F59E0B', // amber-500
  [Category.LEISURE]: '#8B5CF6', // violet-500
  [Category.EDUCATION]: '#EC4899', // pink-500
  [Category.OTHERS]: '#6B7280', // gray-500
};

export const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  [Category.FOOD]: <i className="fas fa-utensils"></i>,
  [Category.TRANSPORT]: <i className="fas fa-car"></i>,
  [Category.HOUSING]: <i className="fas fa-home"></i>,
  [Category.HEALTH]: <i className="fas fa-heartbeat"></i>,
  [Category.LEISURE]: <i className="fas fa-gamepad"></i>,
  [Category.EDUCATION]: <i className="fas fa-graduation-cap"></i>,
  [Category.OTHERS]: <i className="fas fa-ellipsis-h"></i>,
};

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
