import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Plus, Trash2, Edit2, Check, X, GripVertical,
  Save, Clock, Eye, EyeOff, AlertTriangle, CheckCircle
} from 'lucide-react'
import { useToast } from '../../components/Toast'
import { 
  getExamQuestions, addQuestion, updateQuestion, deleteQuestion,
  updateExamSettings
} from '../../api/exams'
import { ConfirmModal } from '../../components/Toast'

export default function ExamBuilder() {
  const { id: courseSlug, examId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  // Exam data
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  // Selected question
  const [selectedQuestionId, setSelectedQuestionId] = useState(null)
  
  // Question form
  const [questionForm, setQuestionForm] = useState({
    question: '',
    points: 10,
    choices: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    timeLimit: null,
    maxTabSwitch: 3,
    isPublished: false
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch exam data
  useEffect(() => {
    fetchExamData()
  }, [examId])

  const fetchExamData = async () => {
    setLoading(true)
    try {
      const data = await getExamQuestions(examId)
      setExam(data)
      setQuestions(data.questions || [])
      setSettings({
        timeLimit: data.timeLimit,
        maxTabSwitch: data.maxTabSwitch || 3,
        isPublished: data.isPublished || false
      })
      // Select first question if exists
      if (data.questions?.length > 0) {
        selectQuestion(data.questions[0])
      }
    } catch (error) {
      console.error('Failed to fetch exam:', error)
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  const selectQuestion = (q) => {
    setSelectedQuestionId(q.id)
    setQuestionForm({
      question: q.question,
      points: q.points,
      choices: q.choices.length > 0 ? q.choices.map(c => ({
        text: c.text,
        isCorrect: c.isCorrect
      })) : [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    })
    setIsEditing(true)
  }

  const handleNewQuestion = () => {
    setSelectedQuestionId(null)
    setQuestionForm({
      question: '',
      points: 10,
      choices: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    })
    setIsEditing(false)
  }

  const handleChoiceChange = (index, field, value) => {
    const newChoices = [...questionForm.choices]
    if (field === 'isCorrect') {
      // Only one correct answer
      newChoices.forEach((c, i) => {
        c.isCorrect = i === index
      })
    } else {
      newChoices[index][field] = value
    }
    setQuestionForm({ ...questionForm, choices: newChoices })
  }

  const handleSaveQuestion = async () => {
    // Validation
    if (!questionForm.question.trim()) {
      toast.error('Please enter a question')
      return
    }

    const filledChoices = questionForm.choices.filter(c => c.text.trim())
    if (filledChoices.length < 2) {
      toast.error('Please enter at least 2 choices')
      return
    }

    const hasCorrect = questionForm.choices.some(c => c.isCorrect && c.text.trim())
    if (!hasCorrect) {
      toast.error('Please mark one choice as correct')
      return
    }

    setSaving(true)
    try {
      const data = {
        question: questionForm.question,
        points: questionForm.points,
        choices: questionForm.choices.filter(c => c.text.trim())
      }

      if (isEditing && selectedQuestionId) {
        // Update existing
        await updateQuestion(selectedQuestionId, data)
        toast.success('Question updated')
      } else {
        // Create new
        const newQ = await addQuestion(examId, data)
        setSelectedQuestionId(newQ.id)
        setIsEditing(true)
        toast.success('Question added')
      }

      // Refresh questions
      await fetchExamData()
    } catch (error) {
      console.error('Failed to save question:', error)
      toast.error('Failed to save question')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await deleteQuestion(deleteConfirm)
      toast.success('Question deleted')
      setDeleteConfirm(null)
      handleNewQuestion()
      await fetchExamData()
    } catch (error) {
      console.error('Failed to delete question:', error)
      toast.error('Failed to delete question')
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await updateExamSettings(examId, settings)
      toast.success('Settings saved')
      setShowSettings(false)
      await fetchExamData()
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/teacher/courses/${courseSlug}/dashboard`)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{exam?.title}</h1>
                <p className="text-sm text-gray-500">
                  {questions.length} questions • {exam?.totalPoints} points
                  {exam?.timeLimit && ` • ${exam.timeLimit} min`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Publish status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                exam?.isPublished 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {exam?.isPublished ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Published
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Draft
                  </>
                )}
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Question List */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <button
                  onClick={handleNewQuestion}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>
              
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {questions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No questions yet
                  </div>
                ) : (
                  <div className="divide-y">
                    {questions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => selectQuestion(q)}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                          selectedQuestionId === q.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">
                              {q.question || 'Untitled question'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {q.points} pts • {q.choices?.length || 0} choices
                            </p>
                          </div>
                          {q.choices?.some(c => c.isCorrect) && (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Question Editor */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question {selectedQuestionId ? `#${questions.findIndex(q => q.id === selectedQuestionId) + 1}` : '(New)'}
                </label>
                <textarea
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Answer Choices
                  <span className="text-gray-400 font-normal ml-2">(Select the correct answer)</span>
                </label>
                <div className="space-y-3">
                  {questionForm.choices.map((choice, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleChoiceChange(idx, 'isCorrect', true)}
                        className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                          choice.isCorrect 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {choice.isCorrect && <Check className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                          {String.fromCharCode(65 + idx)})
                        </span>
                        <input
                          type="text"
                          value={choice.text}
                          onChange={(e) => handleChoiceChange(idx, 'text', e.target.value)}
                          placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                            choice.isCorrect ? 'border-green-300 bg-green-50' : ''
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  {isEditing && selectedQuestionId && (
                    <button
                      onClick={() => setDeleteConfirm(selectedQuestionId)}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Question
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSaveQuestion}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditing ? 'Update Question' : 'Add Question'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Exam Settings</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Time Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={settings.timeLimit || ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    timeLimit: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="No limit"
                  min="1"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no time limit</p>
              </div>

              {/* Max Tab Switches */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Max Tab Switches
                </label>
                <input
                  type="number"
                  value={settings.maxTabSwitch}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    maxTabSwitch: parseInt(e.target.value) || 3 
                  })}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Exam auto-submits if student exceeds this limit
                </p>
              </div>

              {/* Publish */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isPublished}
                    onChange={(e) => setSettings({ ...settings, isPublished: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Publish Exam</span>
                    <p className="text-xs text-gray-500">Students can see and take this exam</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteQuestion}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        confirmStyle="danger"
        loading={deleting}
      />
    </div>
  )
}
