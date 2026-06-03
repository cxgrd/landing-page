export type SubscriptionPlan = 'free' | 'pro';

export const FREE_MONTHLY_AUDIT_LIMIT = 50;
export const FREE_PLAN_FEATURES = [
  '50 audits per month',
  'Local dependency graph (AST)',
  'Blast radius analysis',
  'Compiler-backed checks',
  'No cloud storage',
  'Personal use only',
] as const;

export const PRO_PLAN_FEATURES = [
  'Unlimited audits',
  'Prompt enrichment & repo memory',
  'Advanced analysis features',
  'Cloud backup & sync',
  'Priority support',
  'API access',
] as const;

export interface PlanTier {
  key: SubscriptionPlan;
  name: string;
  description: string;
  priceLabel: string;
  periodLabel: string;
  features: readonly string[];
  monthlyAuditLimit: number | null;
  cloudStorageEnabled: boolean;
  personalUseOnly: boolean;
}

export const PLAN_TIERS: Record<SubscriptionPlan, PlanTier> = {
  free: {
    key: 'free',
    name: 'Free',
    description: 'Perfect for personal local analysis',
    priceLabel: '$0',
    periodLabel: 'forever',
    features: FREE_PLAN_FEATURES,
    monthlyAuditLimit: FREE_MONTHLY_AUDIT_LIMIT,
    cloudStorageEnabled: false,
    personalUseOnly: true,
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    description: 'For advanced analysis, cloud sync, and API workflows',
    priceLabel: '$19',
    periodLabel: 'month',
    features: PRO_PLAN_FEATURES,
    monthlyAuditLimit: null,
    cloudStorageEnabled: true,
    personalUseOnly: false,
  },
};

export function normalizePlan(plan: string | undefined | null): SubscriptionPlan {
  return plan?.toLowerCase() === 'pro' ? 'pro' : 'free';
}

export function isProPlan(plan: SubscriptionPlan): boolean {
  return plan === 'pro';
}

export function getPlanTier(plan: string | undefined | null): PlanTier {
  return PLAN_TIERS[normalizePlan(plan)];
}
