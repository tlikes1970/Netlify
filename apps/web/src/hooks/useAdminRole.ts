/**
 * Process: Admin Role Check
 * Purpose: Check if current user has admin role via Firebase Auth custom claims
 * Data Source: Firebase Auth ID token claims
 * Update Path: Token claims are set by Cloud Function setAdminRole
 * Dependencies: firebaseBootstrap (auth), useAuth (user)
 */

import { useState, useEffect } from "react";
import { auth } from "../lib/firebaseBootstrap";
import { useAuth } from "./useAuth";

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Get ID token result to check custom claims
    const checkAdminRole = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("[useAdminRole] No current user");
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        console.log(
          "[useAdminRole] Checking admin role for user:",
          currentUser.uid
        );
        const token = await currentUser.getIdTokenResult();
        console.log("[useAdminRole] Token claims:", token.claims);
        console.log("[useAdminRole] Role claim:", token.claims.role);
        const isAdminUser = token.claims.role === "admin";
        console.log("[useAdminRole] Is admin?", isAdminUser);
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error("[useAdminRole] Error checking admin role:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading]);

  return { isAdmin, loading };
}
