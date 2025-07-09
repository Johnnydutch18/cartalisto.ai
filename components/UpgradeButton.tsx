'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UpgradeButton({ plan }: { plan: 'standard' | 'pro' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)

    const formData = new FormData()
    formData.append('plan', plan)

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      body: formData,
    })

    if (res.status === 401) {
      router.push(`/login?redirect=/planes&mode=signup`)
      return
    }

    if (!res.ok) {
      alert('Something went wrong.')
      setLoading(false)
      return
    }

    const data = await res.json()
    if (data?.url) {
      window.location.href = data.url
    } else {
      alert('Failed to get Stripe URL.')
      setLoading(false)
    }
  }

  return (
    <button
      disabled={loading}
      onClick={handleClick}
      className={`px-4 py-2 rounded ${
        plan === 'pro'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-black text-white hover:opacity-80'
      }`}
    >
      {loading ? 'Redirigiendo…' : `Elegir ${plan === 'pro' ? 'Pro' : 'Estándar'}`}
    </button>
  )
}
