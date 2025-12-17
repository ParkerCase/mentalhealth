'use client'

import { Group } from '@/lib/types'
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaGlobe } from 'react-icons/fa'

interface GroupCardProps {
  group: Group
  onClick?: () => void
}

export default function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h3>
        
        {group.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{group.description}</p>
        )}

        <div className="space-y-2 text-sm text-gray-600">
          {(group.city || group.state) && (
            <div className="flex items-center">
              <FaMapMarkerAlt className="mr-2 text-gray-400" />
              <span>
                {[group.city, group.state].filter(Boolean).join(', ')}
                {group.zip && ` ${group.zip}`}
              </span>
            </div>
          )}

          {group.email && (
            <div className="flex items-center">
              <FaEnvelope className="mr-2 text-gray-400" />
              <a
                href={`mailto:${group.email}`}
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {group.email}
              </a>
            </div>
          )}

          {group.phone && (
            <div className="flex items-center">
              <FaPhone className="mr-2 text-gray-400" />
              <a
                href={`tel:${group.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {group.phone}
              </a>
            </div>
          )}

          {group.website && (
            <div className="flex items-center">
              <FaGlobe className="mr-2 text-gray-400" />
              <a
                href={group.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800 hover:underline truncate"
              >
                {group.website}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

