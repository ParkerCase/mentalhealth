// src/app/admin/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { hasAdminAccess } from '@/lib/utils/admin'
import Link from 'next/link'
import { 
  FaUsers, 
  FaUserShield, 
  FaClipboardList, 
  FaComment, 
  FaCog,
  FaTachometerAlt 
} from 'react-icons/fa'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading, initialize } = useAuthStore()
  
  useEffect(() => {
    initialize()
  }, [initialize])
  
  useEffect(() => {
    // Check if user is admin based on email domain
    const checkIsAdmin = async () => {
      if (loading) return
      
      if (!user) {
        router.push('/api/auth/login')
        return
      }
      
      // Check if user has admin access based on email domain
      const isAdmin = hasAdminAccess(user.email)
      
      if (!isAdmin) {
        router.push('/')
      }
    }
    
    checkIsAdmin()
  }, [user, loading, router])
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="flex">
        {/* Sidebar */}
        <div className="bg-blue-900 text-white w-64 min-h-screen p-4">
          <div className="text-2xl font-bold mb-8 mt-4">Admin Panel</div>
          
          <nav className="space-y-2">
            <Link
              href="/admin"
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-blue-800"
            >
              <FaTachometerAlt />
              <span>Dashboard</span>
            </Link>
            
            <Link
              href="/admin/groups"
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-blue-800"
            >
              <FaUsers />
              <span>Groups</span>
            </Link>
            
            {/* Removed non-functional tabs: Users, Content, Messages, Settings */}
          </nav>
          
          <div className="absolute bottom-4 left-4">
            <Link
              href="/"
              className="text-blue-300 hover:text-white"
            >
              Return to site
            </Link>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
