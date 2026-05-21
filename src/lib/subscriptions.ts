import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from './auth';

export type SubscriptionPlan = 'free';

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  status: 'active';
  createdAt: string;
}

export interface UsageStats {
  ideasGenerated: number;
  aiCallsUsed: number;
  lastResetDate: string;
  currentPeriodStart: string;
}

const FREE_SUBSCRIPTION: SubscriptionStatus = {
  plan: 'free',
  status: 'active',
  createdAt: new Date(0).toISOString(),
};

export const getUserSubscription = async (
  userId: string
): Promise<SubscriptionStatus | null> => {
  if (!userId) return null;
  return { ...FREE_SUBSCRIPTION, createdAt: new Date().toISOString() };
};

export const getUserUsageStats = async (userId: string): Promise<UsageStats> => {
  const empty: UsageStats = {
    ideasGenerated: 0,
    aiCallsUsed: 0,
    lastResetDate: new Date().toISOString(),
    currentPeriodStart: new Date().toISOString(),
  };
  if (!userId) return empty;

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return empty;
    const data = userSnap.data() as User;
    return (data.usageStats as UsageStats) ?? empty;
  } catch {
    return empty;
  }
};

export const checkUsageLimit = async (
  _userId: string,
  _type: 'idea' | 'ai'
): Promise<{
  canUse: boolean;
  currentUsage: number;
  limit: number;
  plan: SubscriptionPlan;
}> => {
  return { canUse: true, currentUsage: 0, limit: -1, plan: 'free' };
};

export const incrementUsage = async (
  userId: string,
  type: 'idea' | 'ai'
): Promise<boolean> => {
  if (!userId) return true;
  try {
    const userRef = doc(db, 'users', userId);
    const stats = await getUserUsageStats(userId);
    const field = type === 'idea' ? 'ideasGenerated' : 'aiCallsUsed';
    await updateDoc(userRef, {
      [`usageStats.${field}`]: (stats[field] ?? 0) + 1,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Tracking is best-effort; never block the user.
  }
  return true;
};

export const isSubscriptionActive = (_subscription: SubscriptionStatus): boolean => true;
