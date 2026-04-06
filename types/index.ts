// ============================================================
// Digipoli CRM — TypeScript Types
// ============================================================

export type UserRole = 'admin' | 'danışman';

export type CustomerDurum = 'Bekliyor' | 'Takipte' | 'Tamamlandı' | 'İptal';

export type ActivityType = 'note' | 'call' | 'whatsapp' | 'status_change' | 'assignment';

export type WebhookStatus = 'success' | 'error' | 'duplicate';

// ─── DB Row Types ─────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  musteri_id: string;
  ad_soyad: string;
  kanal: string | null;
  tarih: string | null;       // "YYYY-MM-DD"
  saat: string | null;        // "HH:MM"
  steki: string | null;
  stegi_ozel: string | null;
  konusma_ozeti: string | null;
  durum: CustomerDurum;
  atanan_id: string | null;
  notlar: string | null;
  created_at: string;
  updated_at: string;
  // join ile gelen
  atanan?: User | null;
}

export interface CustomerActivity {
  id: string;
  customer_id: string;
  user_id: string | null;
  type: ActivityType;
  content: string | null;
  created_at: string;
  user?: User | null;
}

export interface WebhookLog {
  id: string;
  source: string;
  status: WebhookStatus;
  payload: Record<string, unknown> | null;
  musteri_id: string | null;
  error_msg: string | null;
  created_at: string;
}

// ─── API Payload Types ────────────────────────────────────

/** n8n webhook'tan gelen payload — sheet sütunlarına birebir eşleşir */
export interface N8nWebhookPayload {
  kanal?: string;
  tarih?: string;
  saat?: string;
  musteriId: string;          // zorunlu
  adSoyad: string;            // zorunlu
  steki?: string;
  stegiOzel?: string;
  konusmaOzeti?: string;
  durum?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  color?: string;
}

export interface UpdateCustomerPayload {
  durum?: CustomerDurum;
  atanan_id?: string | null;
  notlar?: string;
  steki?: string;
  stegi_ozel?: string;
  konusma_ozeti?: string;
}

// ─── API Response Types ───────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Dashboard / Stats ────────────────────────────────────

export interface DashboardStats {
  totalCustomers: number;
  bekliyor: number;
  takipte: number;
  tamamlandi: number;
  iptal: number;
  todayNew: number;
  conversionRate: number;
}

export interface ConsultantPerformance {
  user: User;
  total: number;
  tamamlandi: number;
  takipte: number;
  bekliyor: number;
  conversionRate: number;
}
