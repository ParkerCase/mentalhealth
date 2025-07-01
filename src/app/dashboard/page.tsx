'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { 
  FaUsers, FaComments, FaMapMarkerAlt, FaHeart, FaChartLine, 
  FaPlus, FaStar, FaClock, FaPhoneAlt, FaBookOpen, FaUserFriends,
  FaTrophy, FaCalendarAlt, FaExclamationTriangle, FaSun, FaMoon,
  FaBatteryHalf, FaSmile, FaMeh, FaFrown, FaRunning, FaBed
} from 'react-icons/fa'

const SimpleGlobe = dynamic(() => import('@/components/globe/SimpleGlobe'), { ssr: false })

interface MoodEntry {
  id: string;
  mood_rating: number;
  mood_label: string;
  energy_level: number;
  sleep_quality: number;
  stress_level: number;
  notes: string;
  created_at: string;
}

interface WellnessCheckin {
  id: string;
  overall_wellbeing: number;
  physical_health: number;
  mental_health: number;
  social_connections: number;
  work_life_balance: number;
  gratitude_notes: string;
  challenges: string;
  goals_met: boolean;
  created_at: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  target_date: string;
  status: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  url: string;
  content: string;
  tags: string[];
  difficulty_level: string;
  estimated_duration: number;
  is_crisis_resource: boolean;
}

interface EmergencyContact {
  id: string;
  contact_type: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  is_primary: boolean;
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading, initialize } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardData, setDashboardData] = useState<{
    groups: any[];
    recentMessages: any[];
    nearbyGroups: any[];
    recentMood: MoodEntry[];
    todayCheckin: WellnessCheckin | null;
    activeGoals: Goal[];
    featuredResources: Resource[];
    emergencyContacts: EmergencyContact[];
    weeklyProgress: any[];
  }>({
    groups: [],
    recentMessages: [],
    nearbyGroups: [],
    recentMood: [],
    todayCheckin: null,
    activeGoals: [],
    featuredResources: [],
    emergencyContacts: [],
    weeklyProgress: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showQuickMood, setShowQuickMood] = useState(false)
  const [quickMoodRating, setQuickMoodRating] = useState(5)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/api/auth/login')
      return
    }
    
    fetchDashboardData()
  }, [user, profile, loading, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all dashboard data in parallel
      const [
        groupsResult,
        messagesResult,
        moodResult,
        checkinResult,
        goalsResult,
        resourcesResult,
        emergencyResult,
        progressResult
      ] = await Promise.all([
        // Existing data
        supabase.from('groups').select('*').limit(5),
        supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(5),
        
        // New mental health data
        supabase.from('mood_entries').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(7),
        supabase.from('wellness_checkins').select('*').eq('user_id', user!.id).gte('created_at', new Date().toISOString().split('T')[0]).limit(1),
        supabase.from('user_goals').select('*').eq('user_id', user!.id).eq('status', 'active').limit(5),
        supabase.from('mental_health_resources').select('*').eq('is_featured', true).limit(6),
        supabase.from('emergency_contacts').select('*').eq('user_id', user!.id).order('is_primary', { ascending: false }),
        supabase.from('mood_entries').select('mood_rating, created_at').eq('user_id', user!.id).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ])
      
      // Fetch nearby groups if location is available
      let nearbyGroups = []
      if (profile?.location) {
        const { data } = await supabase
          .from('groups')
          .select('*')
          .limit(3)
        nearbyGroups = data || []
      }
      
      setDashboardData({
        groups: groupsResult.data || [],
        recentMessages: messagesResult.data || [],
        nearbyGroups,
        recentMood: moodResult.data || [],
        todayCheckin: checkinResult.data?.[0] || null,
        activeGoals: goalsResult.data || [],
        featuredResources: resourcesResult.data || [],
        emergencyContacts: emergencyResult.data || [],
        weeklyProgress: progressResult.data || []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const submitQuickMood = async () => {
    try {
      const { error } = await supabase.from('mood_entries').insert({
        user_id: user!.id,
        mood_rating: quickMoodRating,
        mood_label: getMoodLabel(quickMoodRating),
        energy_level: 5,
        sleep_quality: 5,
        stress_level: 5
      })
      
      if (!error) {
        setShowQuickMood(false)
        fetchDashboardData() // Refresh data
      }
    } catch (error) {
      console.error('Error submitting mood:', error)
    }
  }

  const getMoodLabel = (rating: number): string => {
    if (rating <= 3) return 'Low'
    if (rating <= 6) return 'Neutral'
    return 'Good'
  }

  const getMoodIcon = (rating: number) => {
    if (rating <= 3) return <FaFrown className="text-red-500" />
    if (rating <= 6) return <FaMeh className="text-yellow-500" />
    return <FaSmile className="text-green-500" />
  }

  const averageMoodThisWeek = dashboardData.weeklyProgress.length > 0 
    ? dashboardData.weeklyProgress.reduce((sum, entry) => sum + entry.mood_rating, 0) / dashboardData.weeklyProgress.length
    : 0

  if (loading || isLoading) {
    return (
      <div className="container mx-auto mobile-container py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto mobile-container py-8 max-w-7xl">
      {/* Mobile-first header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Welcome back, {profile?.full_name || user?.email?.split('@')[0]}
        </h1>
        <p className="text-gray-400 mobile-text">Your mental health journey dashboard</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg min-w-max">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartLine },
            { id: 'mood', label: 'Mood', icon: FaHeart },
            { id: 'goals', label: 'Goals', icon: FaTrophy },
            { id: 'resources', label: 'Resources', icon: FaBookOpen },
            { id: 'connect', label: 'Connect', icon: FaUserFriends }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="text-sm" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions - Mobile Optimized */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="mobile-grid">
              <button
                onClick={() => setShowQuickMood(true)}
                className="flex flex-col items-center justify-center p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors mobile-button"
              >
                <FaHeart className="text-2xl text-blue-400 mb-2" />
                <span className="text-sm font-medium">Log Mood</span>
              </button>
              
              <Link
                href="/wellness/checkin"
                className="flex flex-col items-center justify-center p-4 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors mobile-button"
              >
                <FaChartLine className="text-2xl text-green-400 mb-2" />
                <span className="text-sm font-medium">Wellness Check</span>
              </Link>
              
              <Link
                href="/locator"
                className="flex flex-col items-center justify-center p-4 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors mobile-button"
              >
                <FaMapMarkerAlt className="text-2xl text-purple-400 mb-2" />
                <span className="text-sm font-medium">Find Groups</span>
              </Link>
            </div>
          </div>

          {/* Mental Health Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Current Mood</p>
                  <div className="flex items-center gap-2 mt-1">
                    {dashboardData.recentMood.length > 0 ? (
                      <>
                        {getMoodIcon(dashboardData.recentMood[0].mood_rating)}
                        <span className="text-lg font-semibold">
                          {dashboardData.recentMood[0].mood_rating}/10
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">No data</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Week Average</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FaChartLine className="text-blue-400" />
                    <span className="text-lg font-semibold">
                      {averageMoodThisWeek ? averageMoodThisWeek.toFixed(1) : '0.0'}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Goals</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FaTrophy className="text-yellow-400" />
                    <span className="text-lg font-semibold">{dashboardData.activeGoals.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Check-in Streak</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FaCalendarAlt className="text-green-400" />
                    <span className="text-lg font-semibold">
                      {dashboardData.todayCheckin ? '1' : '0'} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Crisis Resources - Always Visible */}
          <div className="card bg-red-900/20 border-red-500/30">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-red-400 text-xl mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Crisis Support</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-300">Crisis Helpline:</span>
                    <a href="tel:988" className="text-blue-400 hover:text-blue-300 font-medium">
                      <FaPhoneAlt className="inline mr-1" /> 988
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-300">Crisis Text:</span>
                    <a href="sms:741741" className="text-blue-400 hover:text-blue-300 font-medium">
                      Text HOME to 741741
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Groups */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Your Groups</h3>
                <Link href="/locator" className="text-blue-400 hover:text-blue-300 text-sm">
                  View all →
                </Link>
              </div>
              {dashboardData.groups.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.groups.slice(0, 3).map((group) => (
                    <div key={group.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                      <FaUsers className="text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{group.name}</p>
                        <p className="text-sm text-gray-400 truncate">
                          {group.city && group.state ? `${group.city}, ${group.state}` : 'Location not specified'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaUsers className="text-3xl mx-auto mb-3 opacity-50" />
                  <p className="mb-3">You haven't joined any groups yet</p>
                  <Link href="/locator" className="btn-primary inline-block">
                    Find Groups
                  </Link>
                </div>
              )}
            </div>

            {/* Today's Wellness */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Today's Wellness</h3>
                <Link href="/wellness/checkin" className="text-blue-400 hover:text-blue-300 text-sm">
                  Update →
                </Link>
              </div>
              
              {dashboardData.todayCheckin ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Overall Wellbeing</span>
                    <span className="font-medium">{dashboardData.todayCheckin.overall_wellbeing}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Mental Health</span>
                    <span className="font-medium">{dashboardData.todayCheckin.mental_health}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Physical Health</span>
                    <span className="font-medium">{dashboardData.todayCheckin.physical_health}/10</span>
                  </div>
                  {dashboardData.todayCheckin.gratitude_notes && (
                    <div className="mt-4 p-3 bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-300">
                        <strong>Gratitude:</strong> {dashboardData.todayCheckin.gratitude_notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaChartLine className="text-3xl mx-auto mb-3 opacity-50" />
                  <p className="mb-3">Complete your daily wellness check-in</p>
                  <Link href="/wellness/checkin" className="btn-primary inline-block">
                    Start Check-in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mood Tab */}
      {activeTab === 'mood' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Mood Tracking</h2>
            {dashboardData.recentMood.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {dashboardData.recentMood.slice(0, 7).map((entry, index) => (
                    <div key={entry.id} className="text-center">
                      <div className="text-xs text-gray-400 mb-1">
                        {new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {getMoodIcon(entry.mood_rating)}
                        <span className="text-sm font-medium">{entry.mood_rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/mood/track" className="btn-primary inline-block">
                  View Detailed Mood Tracking
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaHeart className="text-4xl mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">Start tracking your mood to see patterns and insights</p>
                <button
                  onClick={() => setShowQuickMood(true)}
                  className="btn-primary"
                >
                  Log Your First Mood
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Goals</h2>
              <Link href="/goals/new" className="btn-primary">
                <FaPlus className="inline mr-2" />
                New Goal
              </Link>
            </div>
            
            {dashboardData.activeGoals.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.activeGoals.map((goal) => {
                  const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0
                  return (
                    <div key={goal.id} className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium">{goal.title}</h3>
                        <span className="text-sm text-gray-400 capitalize">{goal.category.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{goal.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        {goal.target_date && (
                          <div className="text-xs text-gray-400">
                            Due: {new Date(goal.target_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <Link href="/goals" className="btn-secondary inline-block">
                  Manage All Goals
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaTrophy className="text-4xl mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">Set goals to track your mental health journey</p>
                <Link href="/goals/new" className="btn-primary">
                  Create Your First Goal
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Mental Health Resources</h2>
            <div className="mobile-grid">
              {dashboardData.featuredResources.map((resource) => (
                <div key={resource.id} className="p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm">{resource.title}</h3>
                    {resource.is_crisis_resource && (
                      <FaExclamationTriangle className="text-red-400 text-sm flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{resource.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {resource.estimated_duration && (
                        <>
                          <FaClock />
                          <span>{resource.estimated_duration}m</span>
                        </>
                      )}
                    </div>
                    {resource.url ? (
                      <a 
                        href={resource.url} 
                        className="text-blue-400 hover:text-blue-300 text-sm"
                        target={resource.url.startsWith('http') ? '_blank' : '_self'}
                        rel={resource.url.startsWith('http') ? 'noopener noreferrer' : ''}
                      >
                        Access →
                      </a>
                    ) : (
                      <Link href={`/resources/${resource.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/resources" className="btn-secondary inline-block mt-4">
              Browse All Resources
            </Link>
          </div>
        </div>
      )}

      {/* Connect Tab */}
      {activeTab === 'connect' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Groups Globe */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Global Support Network</h3>
              <div className="h-[300px] w-full">
                <SimpleGlobe
                  height={300}
                  groups={dashboardData.groups}
                  initialCoordinates={profile?.location ? {
                    lat: parseFloat(profile.location.split(',')[0] || '0'),
                    lng: parseFloat(profile.location.split(',')[1] || '0')
                  } : undefined}
                  className="w-full h-[300px]"
                />
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Emergency Contacts</h3>
                <Link href="/emergency-contacts" className="text-blue-400 hover:text-blue-300 text-sm">
                  Manage →
                </Link>
              </div>
              
              {dashboardData.emergencyContacts.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.emergencyContacts.slice(0, 3).map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                      <FaPhoneAlt className="text-green-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.name}</p>
                        <p className="text-sm text-gray-400 truncate">{contact.relationship}</p>
                      </div>
                      {contact.phone && (
                        <a 
                          href={`tel:${contact.phone}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Call
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FaPhoneAlt className="text-3xl mx-auto mb-3 text-gray-500" />
                  <p className="text-gray-400 mb-3">Add emergency contacts for quick access during crisis</p>
                  <Link href="/emergency-contacts" className="btn-primary">
                    Add Contacts
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Mood Modal */}
      {showQuickMood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#292929] rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">How are you feeling right now?</h3>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">1 (Low)</span>
                <span className="text-sm text-gray-400">10 (Great)</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={quickMoodRating}
                onChange={(e) => setQuickMoodRating(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-center mt-3">
                <div className="text-2xl mb-1">{getMoodIcon(quickMoodRating)}</div>
                <span className="text-lg font-semibold">{quickMoodRating}/10</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuickMood(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={submitQuickMood}
                className="flex-1 btn-primary"
              >
                Save Mood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
