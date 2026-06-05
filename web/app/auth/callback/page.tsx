'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        // The Supabase client (`@supabase/supabase-js`) automatically parses the hash fragment 
        // in the URL (access_token, etc.) when `createClient` is initialized or when the page loads
        // if using the default local storage persistence.

        // We just need to listen for the session to be established.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || session) {
                // Successfully logged in
                router.replace('/profile')
            }
        })

        // Fallback: If we assume the client handles it instantly, check session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.replace('/profile')
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    return (
        <div className="flex min-h-screen items-center justify-center flex-col gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[var(--color-left)]"></div>
            <p className="font-mono text-xs uppercase text-gray-400 tracking-widest">Authenticating Identity...</p>
        </div>
    )
}
