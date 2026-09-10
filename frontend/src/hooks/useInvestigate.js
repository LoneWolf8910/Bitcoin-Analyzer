import { useState, useCallback } from 'react'
import { investigateWallet, searchWallets } from '../services/api'

export function useInvestigate() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchResults, setSearchResults] = useState(null)

  const investigate = useCallback(async (walletAddress, params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const result = await investigateWallet(walletAddress, params)
      setData(result)
      setSearchResults(null)
      return result
    } catch (err) {
      setError(err.message)
      setData(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const search = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults(null)
      return
    }
    try {
      const result = await searchWallets(query)
      setSearchResults(result)
    } catch (err) {
      setSearchResults({ wallets: [], transactions: [], total_wallets: 0, total_transactions: 0 })
    }
  }, [])

  const clear = useCallback(() => {
    setData(null)
    setError(null)
    setSearchResults(null)
  }, [])

  return {
    data,
    loading,
    error,
    searchResults,
    investigate,
    search,
    clear,
  }
}