// src/app/admin/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
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
    // Check if user is admin - add your own logic here
    const checkIsAdmin = async () => {
      if (loading) return
      
      if (!user) {
        router.push('/api/auth/login')
        return
      }
      
      // This is where you'd check if the user has admin privileges
      // Example: check a custom claim, role in the database, etc.
      // For now, we'll use a simple placeholder
      const isAdmin = true // Replace with your admin check logic
      
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
            
            <Link
              href="/admin/users"
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-blue-800"
            >
              <FaUserShield />
              <span>Users</span>
            </Link>
            
            <Link
              href="/admin/content"
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-blue-800"
            >
              <FaClipboardList />
              <span>Content</span>
            </Link>
            
            <Link
              href="/admin/messages"
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-blue-800"
            >
              <FaComment />
              <span>Messages</span>
            </Link>
            
            <Link
              href="/admin/settings"
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-blue-800"
            >
              <FaCog />
              <span>Settings</span>
            </Link>
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
