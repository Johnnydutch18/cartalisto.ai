'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UpgradeButton({ plan }: { plan: 'standard' | 'pro' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      body: new URLSearchParams({ plan }),
    })

    if (res.status === 401) {
      router.push('/login')
      return
    }

    if (!res.ok) {
      alert('Something went wrong.')
      setLoading(false)
      return
    }

    const redirectUrl = res.url
    window.location.href = redirectUrl
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
