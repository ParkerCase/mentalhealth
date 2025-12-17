'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GroupSearch from '@/components/groups/GroupSearch'
import { Group } from '@/lib/types'

export default function GroupsSearchPage() {
  const router = useRouter()
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  const handleGroupSelect = (group: Group) => {
    // Navigate to group details or show modal
    // For now, just set it to show we can handle it
    setSelectedGroup(group)
    // You could navigate to a group detail page here:
    // router.push(`/groups/${group.id}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search for Groups</h1>
        <p className="text-gray-600">
          Find support groups and communities in your area. Search by location, keywords, or browse all available groups.
        </p>
      </div>

      <GroupSearch onGroupSelect={handleGroupSelect} />

      {selectedGroup && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Selected: <strong>{selectedGroup.name}</strong> - {selectedGroup.city}, {selectedGroup.state}
          </p>
        </div>
      )}
    </div>
  )
}

