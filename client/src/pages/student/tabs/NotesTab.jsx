import { Search, StickyNote, Trash2 } from 'lucide-react'

export default function NotesTab({
  myNotes,
  notesSearchTerm,
  setNotesSearchTerm,
  setDeleteNoteConfirm
}) {
  // Filter notes by search term
  const filteredNotes = myNotes.filter(note => {
    const search = notesSearchTerm.toLowerCase()
    return (
      note.content.toLowerCase().includes(search) ||
      note.session?.lesson?.name?.toLowerCase().includes(search) ||
      note.session?.course?.name?.toLowerCase().includes(search)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">Your personal notes from classes</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={notesSearchTerm}
            onChange={(e) => setNotesSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none w-64"
          />
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {notesSearchTerm ? 'No notes found' : 'No notes yet'}
          </h3>
          <p className="text-gray-500">
            {notesSearchTerm 
              ? 'Try a different search term' 
              : 'Your notes from classes will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map(note => (
            <div key={note.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-[#1e3a5f] font-medium">{note.session?.course?.name}</p>
                  <h3 className="font-semibold text-gray-900">{note.session?.lesson?.name || 'Untitled Class'}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {note.session?.date && new Date(note.session.date).toLocaleDateString('en-PH', { 
                      timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteNoteConfirm(note.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Last updated: {new Date(note.updatedAt).toLocaleDateString('en-PH', { 
                  timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
