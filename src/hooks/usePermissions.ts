import { useSocket } from '../SocketContext';
import { AppCapability, AppSettings } from '../types';

export const usePermissions = () => {
  const { state, currentUser } = useSocket();

  /**
   * Checks if the current user has a specific capability.
   * Logic:
   * 1. Check explicit user permissions (overrides)
   * 2. Check role-based permissions from settings
   * 3. Admins have all permissions by default
   */
  const hasCapability = (capability: AppCapability): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    // Check explicit user overrides
    if (currentUser.permissions && currentUser.permissions[capability] !== undefined) {
      return !!currentUser.permissions[capability];
    }

    // Check role-based permissions from global settings
    const rolePermissions = state?.settings?.role_permissions?.[currentUser.role];
    if (rolePermissions) {
      return rolePermissions.includes(capability);
    }

    return false;
  };

  /**
   * Checks if a global feature flag is enabled.
   */
  const isFeatureEnabled = (feature: keyof NonNullable<AppSettings['featureFlags']>): boolean => {
    // If featureFlags is missing, we assume true for backward compatibility or false depending on logic.
    // For SaaS/Modular, we default to false if not explicitly enabled.
    return !!state?.settings?.featureFlags?.[feature];
  };

  /**
   * Comprehensive access check combining RBAC and Feature Toggles.
   * Admins always get access regardless of feature flags —
   * they control those flags and must always be able to toggle them.
   */
  const canAccess = (capability?: AppCapability, feature?: keyof NonNullable<AppSettings['featureFlags']>) => {
    // Admins bypass ALL feature flags – they are the ones who configure them.
    const isAdmin = currentUser?.role === 'admin';
    if (isAdmin) {
      return { authorized: true, enabled: true, granted: true };
    }

    const authorized = capability ? hasCapability(capability) : true;
    const enabled = feature ? isFeatureEnabled(feature) : true;

    return {
      authorized,
      enabled,
      granted: authorized && enabled
    };
  };

  return {
    hasCapability,
    isFeatureEnabled,
    canAccess,
    role: currentUser?.role,
    isAuthenticated: !!currentUser
  };
};
