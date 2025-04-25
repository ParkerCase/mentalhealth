import { format } from 'date-fns'
import Image from 'next/image'
import { FaUser } from 'react-icons/fa'

interface MessageBubbleProps {
  message: {
    id: string
    sender_id: string
    content: string
    created_at: string
    sender?: {
      username?: string
      avatar_url?: string
    }
  }
  isCurrentUser: boolean
}

export default function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  // Format timestamp
  const timestamp = message.created_at
    ? format(new Date(message.created_at), 'h:mm a')
    : ''

  return (
    <div className={`flex w-full my-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="flex-shrink-0">
          <div className={`h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${isCurrentUser ? 'ml-2' : 'mr-2'}`}>
            {message.sender?.avatar_url ? (
              <Image
                src={message.sender.avatar_url}
                alt={message.sender.username || 'User'}
                width={32}
                height={32}
                className="object-cover"
              />
            ) : (
              <FaUser className="text-gray-500" />
            )}
          </div>
        </div>
        
        <div>
          <div 
            className={`px-4 py-2 rounded-lg ${
              isCurrentUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {message.content}
          </div>
          <div 
            className={`text-xs text-gray-500 mt-1 ${
              isCurrentUser ? 'text-right' : 'text-left'
            }`}
          >
            {timestamp}
          </div>
        </div>
      </div>
    </div>
  )
}