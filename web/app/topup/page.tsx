'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Zap, Crown, Shield, Rocket, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

const PACKAGES = [
    {
        id: 'starter',
        name: 'Recruit Stash',
        points: 100,
        price: 'IDR 15.000',
        icon: <Shield className="h-8 w-8 text-gray-400" />,
        color: 'gray',
        features: ['100 Points', 'No Ads', 'Basic Supporter Badge'],
        popular: false
    },
    {
        id: 'warrior',
        name: 'Warrior Cache',
        points: 500,
        price: 'IDR 50.000',
        icon: <Zap className="h-8 w-8 text-[#00f3ff]" />,
        color: 'cyan',
        features: ['500 Points', '+50 Bonus Points', 'Warrior Badge', 'Vote Effects'],
        popular: true
    },
    {
        id: 'warlord',
        name: 'Warlord Vault',
        points: 2000,
        price: 'IDR 150.000',
        icon: <Rocket className="h-8 w-8 text-[#ff0055]" />,
        color: 'red',
        features: ['2000 Points', '+300 Bonus Points', 'Warlord Badge', 'Profile Glow', 'Priority Support'],
        popular: false
    },
    {
        id: 'king',
        name: 'God Mode',
        points: 10000,
        price: 'IDR 500.000',
        icon: <Crown className="h-8 w-8 text-yellow-400" />,
        color: 'gold',
        features: ['10,000 Points', '+2000 Bonus Points', 'Unique "GOD" Title', 'Global Chat Highlight', 'Direct Dev Access'],
        popular: false
    }
]

export default function TopupPage() {
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()

    const handlePurchase = async (pack: typeof PACKAGES[0]) => {
        setLoading(pack.id)

        try {
            // Check auth first
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert("Please login first to purchase points!")
                router.push('/login') // Assuming generic login redirect or handle logic
                return
            }

            // Simulate Network Delay for realism
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Call RPC
            // @ts-expect-error - RPC args
            const { data, error } = await supabase.rpc('topup_points', {
                p_amount: pack.points,
                p_pack_name: pack.name
            })

            if (error) throw error

            // Trigger Global Point Update with EXACT new balance
            const responseData = data as { new_balance?: number, success?: boolean }
            if (responseData && typeof responseData.new_balance === 'number') {
                window.dispatchEvent(new CustomEvent('kubu-points-sync', { detail: responseData.new_balance }))
            } else {
                window.dispatchEvent(new CustomEvent('kubu-points-sync'))
            }

            alert(`SUCCESS! purchased ${pack.name}. You got ${pack.points} points!`)
            router.push('/') // Redirect home or stay
        } catch (error: any) {
            console.error('Purchase failed', error)
            alert(error.message || "Purchase failed")
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-black pt-20 pb-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#00f3ff]/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff0055]/10 blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">
                        <span className="text-[#00f3ff]">Soul</span> <span className="text-outline-white">Recharge</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Fuel your influence. Dominate the battlefield. Acquire <span className="text-[#00f3ff] font-bold">Points (Nyawa)</span> to vote, create battles, and rise in the ranks.
                    </p>
                </div>

                {/* Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {PACKAGES.map((pack) => {
                        const isCyan = pack.color === 'cyan'
                        const isRed = pack.color === 'red'
                        const isGold = pack.color === 'gold'

                        let borderColor = 'border-white/10'
                        let shineColor = 'bg-white/5'
                        let btnColor = 'bg-white text-black hover:bg-gray-200'

                        if (isCyan) {
                            borderColor = 'border-[#00f3ff]/50'
                            shineColor = 'shadow-[0_0_50px_rgba(0,243,255,0.15)]'
                            btnColor = 'bg-[#00f3ff] text-black hover:bg-[#00c2cc] hover:shadow-[0_0_20px_rgba(0,243,255,0.5)]'
                        } else if (isRed) {
                            borderColor = 'border-[#ff0055]/50'
                            shineColor = 'shadow-[0_0_50px_rgba(255,0,85,0.15)]'
                            btnColor = 'bg-[#ff0055] text-white hover:bg-[#cc0044] hover:shadow-[0_0_20px_rgba(255,0,85,0.5)]'
                        } else if (isGold) {
                            borderColor = 'border-yellow-400/50'
                            shineColor = 'shadow-[0_0_50px_rgba(250,204,21,0.15)]'
                            btnColor = 'bg-yellow-400 text-black hover:bg-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.5)]'
                        }

                        return (
                            <div
                                key={pack.id}
                                className={`
                                    relative flex flex-col rounded-2xl border ${borderColor} bg-black/40 backdrop-blur-md p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-white/5 ${shineColor}
                                    ${pack.popular ? 'scale-105 ring-2 ring-[#00f3ff] z-10' : ''}
                                `}
                            >
                                {pack.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00f3ff] text-black text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-[0_0_15px_#00f3ff]">
                                        Most Popular
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        {pack.icon}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-400 font-mono uppercase tracking-wider">Price</div>
                                        <div className="text-xl font-bold text-white">{pack.price}</div>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black uppercase text-white mb-2">{pack.name}</h3>
                                <div className="text-4xl font-black text-white mb-8 flex items-end gap-2">
                                    {pack.points.toLocaleString()} <span className="text-sm font-bold text-gray-500 mb-2">PTS</span>
                                </div>

                                <div className="flex-1 space-y-4 mb-8">
                                    {pack.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handlePurchase(pack)}
                                    disabled={!!loading}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${btnColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {loading === pack.id ? 'Processing...' : 'Purchase'}
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Footer Note */}
                <div className="mt-20 text-center border-t border-white/5 pt-10">
                    <p className="text-gray-500 text-sm">
                        SECURE PAYMENTS POWERED BY <span className="text-white font-bold">KUBU PAY</span>. INSTANT DELIVERY. NO REFUNDS ON BATTLE STAKES.
                    </p>
                </div>
            </div>
        </div>
    )
}
