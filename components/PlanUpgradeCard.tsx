// components/PlanUpgradeCard.tsx
'use client'

import { useState } from 'react'

interface PlanUpgradeCardProps {
  name: string
  id: 'standard' | 'pro'
  description: string
  features: string[]
  highlight: boolean
  disabled: boolean
}

export default function PlanUpgradeCard({
  name,
  id,
  description,
  features,
  highlight,
  disabled
}: PlanUpgradeCardProps) {
  const [loading, setLoading] = useState(false)

  const upgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: id }),
      })

      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        alert('No checkout URL returned.')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`border p-6 rounded shadow-sm ${
        highlight ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <h2 className="text-xl font-semibold mb-2">{name}</h2>
      <p className="text-sm mb-4">{description}</p>
      <ul className="text-sm mb-4 list-disc pl-5">
        {features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
      {disabled ? (
        <span className="inline-block px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded cursor-default">
          Current Plan
        </span>
      ) : (
        <button
          onClick={upgrade}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Redirecting…' : `Upgrade to ${name}`}
        </button>
      )}
    </div>
  )
}
