import { useRuntimeConfig, useCookie } from '#app'

export interface MarketAnalytics {
  ageDistribution: { age_group: string; count: number }[];
  occupationDistribution: { occupation: string; count: number }[];
  cityDistribution: { city: string; count: number }[];
  yoyTrends: { month: string; new_customers: number }[];
}

export interface CeoAnalytics {
  kpis: {
    new_customers_30d: number;
    new_customers_prev_30d: number;
    revenue_30d: number;
    revenue_prev_30d: number;
  };
  topAgents: {
    id: number;
    full_name: string;
    email: string;
    avatar_url: string;
    total_customers: number;
    total_revenue: number;
  }[];
  topCustomers: {
    id: number;
    full_name: string;
    email: string;
    total_volume: number;
    volume_last_30d: number;
  }[];
  upgradeWatchList: {
    id: number;
    full_name: string;
    tier: string;
    total_volume: number;
  }[];
  charts: {
    revenueTrends: { month: string; revenue: number; profit: number; margin_pct: number }[];
    yoyComparison: { year: number; quarter: number; revenue: number }[];
  }
}

export interface PipelineAnalytics {
  funnel: { lead_status: string; count: number }[];
}

export interface AgentsAnalytics {
  id: number;
  full_name: string;
  email: string;
  avatar_url: string;
  department: string;
  total_assigned: number;
  won_deals: number;
  total_revenue: number;
  revenue_30d: number;
}

export const useDashboard = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
  const tokenCookie = useCookie('crm_auth_token')

  const fetchWithAuth = async <T>(endpoint: string): Promise<T> => {
    try {
      const response = await fetch(`${apiBaseUrl}/dashboard/${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenCookie.value}`
        }
      });
      
      const res = await response.json();
      if (!res.success) {
         throw new Error(res.message || 'Failed to fetch dashboard data');
      }
      return res.data as T;
    } catch (err: any) {
      console.error(`[useDashboard] Error fetching ${endpoint}:`, err);
      throw err;
    }
  }

  const getMarketAnalytics = () => fetchWithAuth<MarketAnalytics>('market');
  const getCeoAnalytics = () => fetchWithAuth<CeoAnalytics>('ceo');
  const getPipelineAnalytics = () => fetchWithAuth<PipelineAnalytics>('pipeline');
  const getAgentsAnalytics = () => fetchWithAuth<AgentsAnalytics[]>('agents');

  return {
    getMarketAnalytics,
    getCeoAnalytics,
    getPipelineAnalytics,
    getAgentsAnalytics
  }
}
