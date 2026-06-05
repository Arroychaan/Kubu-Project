'use client'

interface IncubationIndicatorProps {
    votesLeft: number
}

export default function IncubationIndicator({ votesLeft }: IncubationIndicatorProps) {
    if (votesLeft <= 0) return null

    return (
        <div className="mb-6 rounded-lg border border-dashed border-card-border bg-white/5 p-4">
            <div className="mb-2 text-center text-sm text-muted">
                Vote <span className="font-bold text-foreground">{votesLeft}</span> more times to create battle
            </div>
            <div className="h-1 overflow-hidden rounded-sm bg-card-bg">
                <div
                    className="h-full bg-left shadow-neon transition-all duration-300 ease-out"
                    style={{ width: `${Math.max(0, (10 - votesLeft) * 10)}%` }}
                />
            </div>
        </div>
    )
}
