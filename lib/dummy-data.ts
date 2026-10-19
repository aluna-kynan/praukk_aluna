export type Role = 'admin' | 'petugas' | 'peminjam';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
}

export interface Tool {
  id: string;
  name: string;
  category_id: string;
  stock_total: number;
  stock_available: number;
  condition: 'baik' | 'rusak_ringan' | 'rusak_berat';
  image: string;
}

export interface Loan {
  id: string;
  borrower_id: string;
  tool_id: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';
  due_date: string;
  requested_at: string;
}

export const DUMMY_USERS: User[] = [
  { id: 'u1', full_name: 'Budi Admin', email: 'admin@aluna.com', role: 'admin' },
  { id: 'u2', full_name: 'Siti Petugas', email: 'petugas@aluna.com', role: 'petugas' },
  { id: 'u3', full_name: 'Andi Peminjam', email: 'andi@aluna.com', role: 'peminjam' },
  { id: 'u4', full_name: 'Rina Peminjam', email: 'rina@aluna.com', role: 'peminjam' },
];

export const DUMMY_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Alat Tulis & Menggambar' },
  { id: 'c2', name: 'Elektronik & Presentasi' },
  { id: 'c3', name: 'Olahraga & Aktivitas Fisik' },
];

export const DUMMY_TOOLS: Tool[] = [
  { id: 't1', name: 'Proyektor Epson', category_id: 'c2', stock_total: 5, stock_available: 3, condition: 'baik', image: 'https://images.unsplash.com/photo-1543304193-471249788e36?q=80&w=256&auto=format&fit=crop' },
  { id: 't2', name: 'Microphone Wireless', category_id: 'c2', stock_total: 10, stock_available: 10, condition: 'baik', image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=256&auto=format&fit=crop' },
  { id: 't3', name: 'Papan Tulis Whiteboard', category_id: 'c1', stock_total: 20, stock_available: 18, condition: 'baik', image: 'https://images.unsplash.com/photo-1574607383077-47ddc2dc51c4?q=80&w=256&auto=format&fit=crop' },
  { id: 't4', name: 'Bola Basket Molten', category_id: 'c3', stock_total: 15, stock_available: 5, condition: 'rusak_ringan', image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=256&auto=format&fit=crop' },
  { id: 't5', name: 'Laptop Asus ROG', category_id: 'c2', stock_total: 2, stock_available: 0, condition: 'baik', image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=256&auto=format&fit=crop' },
];

export const DUMMY_LOANS: Loan[] = [
  { id: 'l1', borrower_id: 'u3', tool_id: 't1', quantity: 1, status: 'approved', due_date: '2026-09-05', requested_at: '2026-09-02T10:00:00Z' },
  { id: 'l2', borrower_id: 'u4', tool_id: 't3', quantity: 2, status: 'pending', due_date: '2026-09-06', requested_at: '2026-09-03T08:30:00Z' },
  { id: 'l3', borrower_id: 'u3', tool_id: 't5', quantity: 1, status: 'returned', due_date: '2026-09-01', requested_at: '2026-08-28T09:15:00Z' },
];
