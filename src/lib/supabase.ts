import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwopkdctnsqroonwothe.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3b3BrZGN0bnNxcm9vbndvdGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NDc4MDcsImV4cCI6MjA5ODAyMzgwN30.dQ01TF3JcJL8UIBE7F5g88l4_KR39ieoqON9qA4kL_c';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Lancamento = {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  data: string; // YYYY-MM-DD
  categoria: string;
  is_recorrente: boolean;
  created_at: string;
};
