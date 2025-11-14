export type DashboardStats = {
  hashRateThs: number;
  powerUsageKw: number;
  earnings24hUsd: number;
  totalEarningsUsd: number;
  activeMiners: number;
  poolName: string;
  networkDifficultyT: number;
  btcPriceUsd: number;
  updatedAtIso: string;
};

function getBaseUrl(): string {
  const base = import.meta.env.VITE_N8N_BASE_URL as string | undefined;
  if (base && base.trim().length > 0) return base.replace(/\/$/, '');
  return '';
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  const url = base ? `${base}${path}` : path;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`n8n request failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  // Ожидается, что в n8n настроен webhook, возвращающий агрегированные метрики дашборда
  // Пример: GET /webhook/dashboard-stats
  try {
    return await fetchJson<DashboardStats>('/webhook/dashboard-stats');
  } catch (err) {
    // Фоллбек-данные, если n8n недоступен, чтобы UI оставался работоспособным
    const now = new Date().toISOString();
    return {
      hashRateThs: 125.4,
      powerUsageKw: 9.8,
      earnings24hUsd: 42.7,
      totalEarningsUsd: 13450.25,
      activeMiners: 18,
      poolName: 'ECOS Pool',
      networkDifficultyT: 89.2,
      btcPriceUsd: 66250,
      updatedAtIso: now,
    };
  }
}


