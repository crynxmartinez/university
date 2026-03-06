import { MessageSquare } from 'lucide-react'

export default function MessagesTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Messages</h2>
      <p className="text-gray-500 mb-4">Coming Soon</p>
      <p className="text-sm text-gray-400 max-w-md mx-auto">
        You'll be able to send and receive messages from your students here.
      </p>
    </div>
  )
}
