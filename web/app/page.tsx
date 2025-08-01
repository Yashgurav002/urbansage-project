'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'


interface Issue {
  id: number
  title: string
  description: string
  location: string
  status: string
  created_at: string
  category: string
  priority_score: number
  priority_level: string
  sentiment: string
  ai_confidence: number
  urgency_score: number
}

interface Stats {
  total_issues: number
  priority_distribution: {
    HIGH: number
    MEDIUM: number
    LOW: number
  }
  categories: Array<{category: string, count: number}>
  average_priority_score: number
  ai_status: string
}

export default function Home() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  // Fetch issues and stats on component mount
  useEffect(() => {
    fetchIssues()
    fetchStats()
  }, [selectedCategory, selectedPriority])

  // Fetch issues from API with filters
  const fetchIssues = async () => {
    try {
      let url = 'http://localhost:8000/issues'
      const params = new URLSearchParams()
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      if (selectedPriority !== 'all') {
        params.append('priority', selectedPriority)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await axios.get(url)
      setIssues(response.data)
    } catch (error) {
      console.error('Error fetching issues:', error)
      setMessage('Error fetching issues from database')
    }
  }

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Submit new issue
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await axios.post('http://localhost:8000/issues', formData)
      setMessage('Issue analyzed with AI and saved to database!')
      setFormData({ title: '', description: '', location: '' })
      await fetchIssues()
      await fetchStats()
    } catch (error) {
      console.error('Error creating issue:', error)
      setMessage('Error saving issue to database')
    } finally {
      setLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get priority color
  const getPriorityColor = (level: string) => {
    switch(level) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons = {
      infrastructure: '🏗️',
      lighting: '💡',
      safety: '🚨',
      cleanliness: '🧹',
      transportation: '🚦',
      environment: '🌱',
      general: '📝'
    }
    return icons[category as keyof typeof icons] || '📝'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🏙️ UrbanSage AI
          </h1>
          <p className="text-gray-600 mt-1">Smart City Issue Management with AI Classification & Priority Scoring</p>
          
          {/* AI Status */}
          {stats && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                stats.ai_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                🤖 AI Status: {stats.ai_status}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total Issues</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total_issues}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
              <p className="text-2xl font-bold text-red-600">{stats.priority_distribution.HIGH}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Medium Priority</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.priority_distribution.MEDIUM}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Avg Priority Score</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.average_priority_score}/10</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Issue Submission Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              🤖 Report Issue (AI-Powered Analysis)
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Dangerous pothole on Main Street"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Describe the issue in detail (AI will analyze urgency and category)"
                  required
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Downtown near City Hall"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? '🤖 AI Analyzing...' : '🚀 Submit for AI Analysis'}
              </button>
            </form>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${
                message.includes('Error') 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Issues List with Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                AI-Classified Issues ({issues.length})
              </h2>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                <option value="infrastructure">🏗️ Infrastructure</option>
                <option value="lighting">💡 Lighting</option>
                <option value="safety">🚨 Safety</option>
                <option value="cleanliness">🧹 Cleanliness</option>
                <option value="transportation">🚦 Transportation</option>
                <option value="environment">🌱 Environment</option>
                <option value="general">📝 General</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">🔴 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🟢 Low Priority</option>
              </select>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {issues.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No issues match your filters. Submit the first issue!
                </p>
              ) : (
                issues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 flex items-center">
                        {getCategoryIcon(issue.category)} {issue.title}
                      </h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(issue.priority_level)}`}>
                          {issue.priority_level} ({issue.priority_score}/10)
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                    <p className="text-xs text-gray-500 mb-2">📍 {issue.location}</p>
                    
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex gap-4">
                        <span className="text-blue-600">Category: {issue.category}</span>
                        <span className="text-purple-600">Sentiment: {issue.sentiment}</span>
                      </div>
                      <span className="text-gray-400">
                        {formatDate(issue.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
