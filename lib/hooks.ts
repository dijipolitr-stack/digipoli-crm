// ============================================================
// lib/hooks.ts  —  Tüm API çağrıları için React hooks
// ============================================================
// Kullanım: import { useCustomers, useUsers } from '@/lib/hooks'

'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  Customer, User, DashboardStats,
  ConsultantPerformance, UpdateCustomerPayload, WebhookLog,
} from '@/types';

// ─── Generic fetcher ──────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json.data;
}

// ─── Customers ────────────────────────────────────────────

interface UseCustomersOptions {
  durum?: string;
  atanan_id?: string;
  q?: string;
  page?: number;
}

export function useCustomers(opts: UseCustomersOptions = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [count, setCount]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const params = new URLSearchParams();
  if (opts.durum)     params.set('durum', opts.durum);
  if (opts.atanan_id) params.set('atanan_id', opts.atanan_id);
  if (opts.q)         params.set('q', opts.q);
  if (opts.page)      params.set('page', String(opts.page));

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers?${params}`);
      const json = await res.json();
      setCustomers(json.data ?? []);
      setCount(json.count ?? 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [params.toString()]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const updateCustomer = async (id: string, payload: UpdateCustomerPayload & { _activity?: any }) => {
    await apiFetch(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    fetch_();
  };

  const deleteCustomer = async (id: string) => {
    await apiFetch(`/api/customers/${id}`, { method: 'DELETE' });
    fetch_();
  };

  return { customers, count, loading, error, refetch: fetch_, updateCustomer, deleteCustomer };
}

export function useCustomer(id: string) {
  const [customer, setCustomer]     = useState<Customer | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/customers/${id}`)
      .then(r => r.json())
      .then(json => {
        setCustomer(json.data?.customer ?? null);
        setActivities(json.data?.activities ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { customer, activities, loading, error };
}

// ─── Users ────────────────────────────────────────────────

export function useUsers() {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<User[]>('/api/users');
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const createUser = async (payload: any) => {
    await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(payload) });
    fetch_();
  };

  const updateUser = async (id: string, payload: any) => {
    await apiFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    fetch_();
  };

  const deactivateUser = async (id: string) => {
    await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
    fetch_();
  };

  return { users, loading, error, refetch: fetch_, createUser, updateUser, deactivateUser };
}

// ─── Performance / Stats ──────────────────────────────────

export function usePerformance() {
  const [stats, setStats]             = useState<DashboardStats | null>(null);
  const [performance, setPerformance] = useState<ConsultantPerformance[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/performance')
      .then(r => r.json())
      .then(json => {
        setStats(json.data?.stats ?? null);
        setPerformance(json.data?.performance ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { stats, performance, loading, error };
}

// ─── Webhook Logs ─────────────────────────────────────────

export function useWebhookLogs(limit = 20) {
  const [logs, setLogs]       = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/webhook/logs?limit=${limit}`)
      .then(r => r.json())
      .then(json => setLogs(json.data ?? []))
      .finally(() => setLoading(false));
  }, [limit]);

  return { logs, loading };
}
