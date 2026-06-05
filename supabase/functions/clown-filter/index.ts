// @ts-nocheck
// deno-lint-ignore-file
// ============================================
// KUBU Clown Filter Edge Function
// Proxies to Hugging Face for hate speech detection
// Returns 🤡 for toxic content, original for safe
// ============================================
/// <reference lib="deno.ns" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const HUGGINGFACE_API_URL =
    "https://api-inference.huggingface.co/models/Hate-speech-CNERG/dehatebert-mono-indonesian"

// Toxicity threshold (0.0 - 1.0)
const TOXICITY_THRESHOLD = 0.7

// Fallback model if primary is unavailable
const FALLBACK_MODEL_URL =
    "https://api-inference.huggingface.co/models/unitary/toxic-bert"

// Types
interface HFClassification {
    label: string
    score: number
}

interface FilterRequest {
    text: string
    battle_id?: string
    save_to_db?: boolean
}

interface FilterResponse {
    success: boolean
    original_text: string
    displayed_text: string
    is_toxic: boolean
    toxicity_score: number
    model_used: string
    comment_id?: string
}

// Helper: Check if a label indicates toxicity
function isToxicLabel(label: string): boolean {
    const toxicLabels = [
        "hate",
        "toxic",
        "label_1",
        "offensive",
        "hateful",
        "abusive",
    ]
    return toxicLabels.some((t) => label.toLowerCase().includes(t))
}

// Helper: Query Hugging Face model
async function queryHuggingFace(
    text: string,
    apiKey: string,
    modelUrl: string
): Promise<{ score: number; label: string } | null> {
    try {
        const response = await fetch(modelUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: text }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`HF API Error (${response.status}):`, errorText)

            // Model loading - return null to trigger fallback
            if (response.status === 503) {
                return null
            }
            throw new Error(`HuggingFace API error: ${response.status}`)
        }

        const results: HFClassification[][] = await response.json()

        if (!Array.isArray(results) || results.length === 0) {
            return null
        }

        // Find the toxic/hate label with highest score
        const classifications = results[0]
        let maxToxicScore = 0
        let toxicLabel = ""

        for (const classification of classifications) {
            if (isToxicLabel(classification.label)) {
                if (classification.score > maxToxicScore) {
                    maxToxicScore = classification.score
                    toxicLabel = classification.label
                }
            }
        }

        return { score: maxToxicScore, label: toxicLabel }
    } catch (error) {
        console.error("HuggingFace query error:", error)
        return null
    }
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Only accept POST
    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        // Get API keys from environment
        const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!HUGGINGFACE_API_KEY) {
            throw new Error('HUGGINGFACE_API_KEY not configured')
        }

        // Parse request body
        const body: FilterRequest = await req.json()
        const { text, battle_id, save_to_db = false } = body

        // Validate input
        if (!text || typeof text !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Text is required and must be a string' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const trimmedText = text.trim()
        if (trimmedText.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Text cannot be empty' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (trimmedText.length > 1000) {
            return new Response(
                JSON.stringify({ error: 'Text too long. Maximum 1000 characters.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Query primary model (IndoBERT for Indonesian hate speech)
        let result = await queryHuggingFace(
            trimmedText,
            HUGGINGFACE_API_KEY,
            HUGGINGFACE_API_URL
        )
        let modelUsed = 'dehatebert-mono-indonesian'

        // Fallback to toxic-bert if primary fails
        if (result === null) {
            console.log('Primary model unavailable, trying fallback...')
            result = await queryHuggingFace(
                trimmedText,
                HUGGINGFACE_API_KEY,
                FALLBACK_MODEL_URL
            )
            modelUsed = 'toxic-bert (fallback)'
        }

        // If both models fail, pass through with warning
        if (result === null) {
            console.warn('All models unavailable, passing through unfiltered')
            const response: FilterResponse = {
                success: true,
                original_text: trimmedText,
                displayed_text: trimmedText,
                is_toxic: false,
                toxicity_score: 0,
                model_used: 'none (models unavailable)',
            }

            return new Response(JSON.stringify(response), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Determine toxicity
        const toxicityScore = result.score
        const isToxic = toxicityScore >= TOXICITY_THRESHOLD
        const displayedText = isToxic ? '🤡' : trimmedText

        console.log(
            `Clown Filter: toxic=${isToxic}, score=${toxicityScore.toFixed(3)}, model=${modelUsed}`
        )

        // Build response
        const response: FilterResponse = {
            success: true,
            original_text: trimmedText,
            displayed_text: displayedText,
            is_toxic: isToxic,
            toxicity_score: Math.round(toxicityScore * 1000) / 1000,
            model_used: modelUsed,
        }

        // Optionally save to database
        if (save_to_db && battle_id && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
            try {
                // Get user from auth header
                const authHeader = req.headers.get('Authorization')
                if (authHeader) {
                    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

                    // Verify the user's JWT
                    const token = authHeader.replace('Bearer ', '')
                    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

                    if (user && !authError) {
                        // Insert comment
                        const { data: comment, error: insertError } = await supabase
                            .from('comments')
                            .insert({
                                user_id: user.id,
                                battle_id: battle_id,
                                original_text: trimmedText,
                                displayed_text: displayedText,
                                is_toxic: isToxic,
                                toxicity_score: toxicityScore,
                            })
                            .select('id')
                            .single()

                        if (comment && !insertError) {
                            response.comment_id = comment.id
                        } else {
                            console.error('Failed to save comment:', insertError)
                        }
                    }
                }
            } catch (dbError) {
                console.error('Database save error:', dbError)
                // Don't fail the request, just log
            }
        }

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Clown Filter Error:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
