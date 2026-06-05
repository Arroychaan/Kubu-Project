'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/types/supabase'

type CommentRow = Database['public']['Tables']['comments']['Row']

interface Comment extends CommentRow {
    user?: {
        title: string | null
    } | null
    vote_side?: 'left' | 'right' | null
}

interface BakuHantamListProps {
    battleId: string
    userSide?: 'left' | 'right' | null // Current user's side
}

export default function BakuHantamList({ battleId, userSide }: BakuHantamListProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const listRef = useRef<HTMLDivElement>(null)

    // Load initial comments
    useEffect(() => {
        const fetchComments = async () => {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:users(title)
                `) // Note: fetching vote side usually requires a complex join or separate query
                .eq('battle_id', battleId)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching comments:', error)
            } else {
                // For now, we won't fetch the vote side for every comment to save N+1 queries 
                // unless we implement a view or specific RPC. 
                // We'll trust the "Optimistic UI" for the current user's comments.
                setComments(data as Comment[])
            }
        }

        fetchComments()

        // Real-time subscription
        const channel = supabase
            .channel(`comments-${battleId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `battle_id=eq.${battleId}`,
                },
                async (payload) => {
                    const inserted = payload.new as CommentRow

                    // Fetch author details to avoid "New Challenger"
                    const { data: userData } = await supabase
                        .from('users')
                        .select('title')
                        .eq('id', inserted.user_id)
                        .single()

                    setComments((prev) => {
                        // Check for duplicates (safeguard)
                        if (prev.some(c => c.id === inserted.id)) return prev

                        return [...prev, {
                            ...inserted,
                            user: { title: (userData as { title: string } | null)?.title || 'Unknown Agent' },
                            // Optimistically assume the vote side if we knew it? 
                            // For now, leave undefined.
                        }]
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [battleId])

    // Auto-scroll to bottom
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [comments])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        setIsSubmitting(true)

        setIsSubmitting(true)

        // Optimistic update removed - relying on Realtime subscription
        setNewComment('')

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                console.error("User not logged in")
                // Remove optimistic?
                return;
            }

            // @ts-expect-error - Supabase insert type mismatch
            const { error } = await supabase.from('comments').insert({
                user_id: user.id,
                battle_id: battleId,
                original_text: newComment,
                displayed_text: newComment
            })

            if (error) {
                console.error('Failed to post comment:', error)
                // Remove optimistic comment? 
            }

        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex h-[500px] flex-col overflow-hidden rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm">
            {/* Header */}
            <div className="border-b border-white/5 bg-white/5 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                    <span className="text-xl">💬</span> Baku Hantam Room
                </h3>
            </div>

            {/* Chat Area */}
            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {comments.map((comment) => {
                    // Determine styling based on logic (mocked for now without vote side join)
                    // If we had vote_side, we would check 'left' or 'right'
                    let borderColor = 'border-white/10'
                    let textColor = 'text-gray-300'

                    if (comment.vote_side === 'left') {
                        borderColor = 'border-[var(--color-left)]'
                        textColor = 'text-cyan-100' // slightly tinted
                    } else if (comment.vote_side === 'right') {
                        borderColor = 'border-[var(--color-right)]'
                        textColor = 'text-rose-100'
                    }

                    const isToxic = comment.is_toxic

                    return (
                        <div key={comment.id} className={`flex flex-col gap-1 rounded-lg border-l-2 bg-white/5 p-3 ${borderColor}`}>
                            <div className="flex items-center justify-between text-[10px] text-gray-500">
                                <span className="font-bold uppercase tracking-wider text-white/50">{comment.user?.title || 'User'}</span>
                                <span>{new Date(comment.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className={`text-sm ${textColor}`}>
                                {isToxic ? (
                                    <span className="italic opacity-50">🤡 {comment.displayed_text}</span>
                                ) : (
                                    comment.displayed_text
                                )}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="border-t border-white/10 bg-black/60 p-3">
                <div className="relative">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Lempar argumen..."
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-gray-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmitting}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                        ➤
                    </button>
                </div>
            </form>
        </div>
    )
}
