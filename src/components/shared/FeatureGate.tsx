import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { AppCapability, AppSettings } from '../../types';
import { AccessDenied } from './AccessDenied';

interface FeatureGateProps {
  children: React.ReactNode;
  capability?: AppCapability;
  feature?: keyof NonNullable<AppSettings['featureFlags']>;
  mode?: 'hide' | 'gate';
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
  compact?: boolean;
}

/**
 * FeatureGate component to handle conditional rendering based on RBAC and Features.
 * 
 * Usage:
 * <FeatureGate capability="FINANCE_LEDGER_VIEW" feature="enableFinance" mode="gate">
 *   <FinanceStats />
 * </FeatureGate>
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  children,
  capability,
  feature,
  mode = 'hide',
  fallback,
  title,
  description,
  compact = false
}) => {
  const { canAccess } = usePermissions();
  const { authorized, enabled, granted } = canAccess(capability, feature);

  if (granted) {
    return <>{children}</>;
  }

  // If not authorized or not enabled
  if (mode === 'hide') {
    return null;
  }

  // Mode is 'gate' - show AccessDenied or custom fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <AccessDenied 
      title={title} 
      description={description} 
      feature={feature || capability} 
      compact={compact}
    />
  );
};
