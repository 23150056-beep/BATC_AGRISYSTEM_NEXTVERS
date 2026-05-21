import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api/auth.api";

// Track in-memory state for bfcache detection
let wasPageHidden = false;

/**
 * Prevents browser bfcache from serving authenticated pages without re-authentication.
 * 
 * When user navigates back/forward using browser buttons:
 * 1. Leaving an authenticated page sets a flag (wasPageHidden = true)
 * 2. When page is shown again via bfcache with the flag set, we verify with server
 * 3. If verification fails, we redirect to login
 */
export function useSessionValidation() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    // Only for authenticated pages
    if (!isAuthenticated) {
      return;
    }

    // When leaving this authenticated page, set flag
    const handlePagehide = () => {
      wasPageHidden = true;
    };

    // When page is shown again, check if it's from bfcache
    const handlePageshow = (e: PageTransitionEvent) => {
      // If page was hidden and is now shown, it might be from bfcache
      if (e.persisted && wasPageHidden) {
        console.log("Detected potential bfcache restore, verifying session...");
        
        // Verify with server that session is still valid
        authApi
          .me()
          .then(() => {
            // Session still valid, allow viewing
            console.log("Session verified, page accessible");
            wasPageHidden = false;
          })
          .catch((err) => {
            // Session invalid - user must login again
            console.log("Session invalid or expired, redirecting to login");
            logout();
            window.location.href = "/login";
          });
      } else {
        wasPageHidden = false;
      }
    };

    window.addEventListener("pagehide", handlePagehide);
    window.addEventListener("pageshow", handlePageshow);

    return () => {
      window.removeEventListener("pagehide", handlePagehide);
      window.removeEventListener("pageshow", handlePageshow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}

