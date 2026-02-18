import type { RecommendedItem } from './api';

export type Props = {
  items: RecommendedItem[];
  categories: string[];
  listItems: string[];
  onAdd: (item: string, quantity: string, category: string) => void;
  onUpdate: (index: number, item: string, category: string) => void;
  onDelete: (index: number) => void;
};
