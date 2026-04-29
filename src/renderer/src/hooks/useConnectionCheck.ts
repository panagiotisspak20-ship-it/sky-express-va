import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../services/supabase'

/**
 * Lightweight hook that pings Supabase on mount (and whenever `key` changes).
 * If the ping fails, it fires a branded error toast with a 5-second countdown that auto-dismisses.
 * Pass `location.pathname` as key so it re-checks on every page navigation.
 */
export function useConnectionCheck(key?: string): void {
  const toastIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Dismiss previous toast so a fresh one (with fresh animation) can appear
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }

    const check = async (): Promise<void> => {
      try {
        // Lightweight query — just grab the authenticated session (local, fast)
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (!session) return // Not logged in, skip

        // Try a tiny round-trip to Supabase to verify actual connectivity
        const { error } = await supabase.from('profiles').select('id').limit(1).single()

        if (!cancelled && error) {
          const id = `conn-err-${Date.now()}`
          toastIdRef.current = id
          toast.error('⚡ Connection issue detected. Some data may be stale.', {
            id,
            duration: 5000
          })
        }
      } catch {
        if (!cancelled) {
          const id = `conn-err-${Date.now()}`
          toastIdRef.current = id
          toast.error('⚡ Unable to reach server. Please check your connection.', {
            id,
            duration: 5000
          })
        }
      }
    }

    check()

    return (): void => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
