import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Plus, Trash2, Check, Save, Clock, Eye, EyeOff, 
  AlertTriangle, CheckCircle, AlertCircle, X
} from 'lucide-react'
import { useToast, ConfirmModal } from '../../components/Toast'
import { 
  getCourseExam, updateCourseExam, saveAllCourseExamQuestions
} from '../../api/adminCourseExams'

export default function AdminCourseExamBuilder() {
  const { id: courseId, examId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  // Exam data from server (original)
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Local state for questions (not saved until "Save All")
  const [localQuestions, setLocalQuestions] = useState([])
  const [originalQuestions, setOriginalQuestions] = useState([]) // To compare for changes
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]) // Track deleted questions

  // Selected question index (not ID, since new questions don't have IDs)
  const [selectedIndex, setSelectedIndex] = useState(null)

  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    title: '',
    description: '',
    timeLimit: null,
    maxTabSwitch: 3,
    isPublished: false
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Validation errors
  const [validationErrors, setValidationErrors] = useState([])
  const [showErrors, setShowErrors] = useState(false)

  // Unsaved changes warning
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (deletedQuestionIds.length > 0) return true
    if (localQuestions.length !== originalQuestions.length) return true
    
    // Deep compare questions
    for (let i = 0; i < localQuestions.length; i++) {
      const local = localQuestions[i]
      const original = originalQuestions[i]
      
      if (!original) return true // New question
      if (local.question !== original.question) return true
      if (local.points !== original.points) return true
      if (local.choices.length !== original.choices.length) return true
      
      for (let j = 0; j < local.choices.length; j++) {
        const lc = local.choices[j]
        const oc = original.choices[j]
        if (!oc) return true
        if (lc.text !== oc.text) return true
        if (lc.isCorrect !== oc.isCorrect) return true
      }
    }
    
    return false
  }, [localQuestions, originalQuestions, deletedQuestionIds])

  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Fetch exam data
  useEffect(() => {
    fetchExamData()
  }, [examId])

  const fetchExamData = async () => {
    setLoading(true)
    try {
      const data = await getCourseExam(examId)
      setExam(data)
      
      // Initialize local questions from server data
      const questions = (data.questions || []).map(q => ({
        id: q.id,
        question: q.question,
        points: q.points,
        choices: q.choices.map(c => ({
          id: c.id,
          text: c.text,
          isCorrect: c.isCorrect
        }))
      }))
      
      setLocalQuestions(questions)
      setOriginalQuestions(JSON.parse(JSON.stringify(questions))) // Deep copy
      setDeletedQuestionIds([])
      
      setSettings({
        title: data.title,
        description: data.description || '',
        timeLimit: data.timeLimit,
        maxTabSwitch: data.maxTabSwitch || 3,
        isPublished: data.isPublished || false
      })
      
      // Select first question if exists
      if (questions.length > 0) {
        setSelectedIndex(0)
      }
    } catch (error) {
      console.error('Failed to fetch exam:', error)
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  // Add new question (local only)
  const handleAddQuestion = () => {
    const newQuestion = {
      id: null, // No ID yet - will be assigned on save
      tempId: `temp-${Date.now()}`, // Temporary ID for React key
      question: '',
      points: 10,
      choices: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    }
    setLocalQuestions([...localQuestions, newQuestion])
    setSelectedIndex(localQuestions.length) // Select the new question
  }

  // Update question locally
  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...localQuestions]
    updated[index] = { ...updated[index], [field]: value }
    setLocalQuestions(updated)
  }

  // Update choice locally
  const handleUpdateChoice = (questionIndex, choiceIndex, field, value) => {
    const updated = [...localQuestions]
    const choices = [...updated[questionIndex].choices]
    
    if (field === 'isCorrect') {
      // Only one correct answer
      choices.forEach((c, i) => {
        c.isCorrect = i === choiceIndex
      })
    } else {
      choices[choiceIndex] = { ...choices[choiceIndex], [field]: value }
    }
    
    updated[questionIndex] = { ...updated[questionIndex], choices }
    setLocalQuestions(updated)
  }

  // Delete question locally
  const handleDeleteQuestion = (index) => {
    const question = localQuestions[index]
    
    // If it has an ID (exists in DB), track for deletion
    if (question.id) {
      setDeletedQuestionIds([...deletedQuestionIds, question.id])
    }
    
    const updated = localQuestions.filter((_, i) => i !== index)
    setLocalQuestions(updated)
    
    // Adjust selected index
    if (selectedIndex >= updated.length) {
      setSelectedIndex(updated.length > 0 ? updated.length - 1 : null)
    } else if (selectedIndex === index) {
      setSelectedIndex(updated.length > 0 ? Math.min(index, updated.length - 1) : null)
    }
    
    toast.success('Question removed')
  }

  // Validate all questions
  const validateQuestions = () => {
    const errors = []
    
    localQuestions.forEach((q, idx) => {
      const qNum = idx + 1
      
      if (!q.question.trim()) {
        errors.push(`Question ${qNum}: Missing question text`)
      }
      
      const filledChoices = q.choices.filter(c => c.text.trim())
      if (filledChoices.length < 2) {
        errors.push(`Question ${qNum}: Need at least 2 choices`)
      }
      
      const hasCorrect = q.choices.some(c => c.isCorrect && c.text.trim())
      if (!hasCorrect) {
        errors.push(`Question ${qNum}: No correct answer selected`)
      }
    })
    
    return errors
  }

  // Save all questions
  const handleSaveAll = async () => {
    // Validate first
    const errors = validateQuestions()
    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowErrors(true)
      return
    }
    
    setSaving(true)
    try {
      // Prepare data for batch save
      const questionsToSave = localQuestions.map((q, idx) => ({
        id: q.id, // null for new questions
        question: q.question,
        points: q.points,
        order: idx,
        choices: q.choices.filter(c => c.text.trim()).map((c, cIdx) => ({
          id: c.id,
          text: c.text,
          isCorrect: c.isCorrect,
          order: cIdx
        }))
      }))
      
      await saveAllCourseExamQuestions(examId, {
        questions: questionsToSave,
        deletedQuestionIds
      })
      
      toast.success('All questions saved!')
      
      // Refresh from server to get new IDs
      await fetchExamData()
    } catch (error) {
      console.error('Failed to save questions:', error)
      toast.error('Failed to save questions')
    } finally {
      setSaving(false)
    }
  }

  // Discard changes
  const handleDiscardChanges = () => {
    setLocalQuestions(JSON.parse(JSON.stringify(originalQuestions)))
    setDeletedQuestionIds([])
    setSelectedIndex(originalQuestions.length > 0 ? 0 : null)
    toast.success('Changes discarded')
  }

  // Handle navigation with unsaved changes
  const handleNavigateBack = () => {
    if (hasUnsavedChanges()) {
      setShowLeaveWarning(true)
      setPendingNavigation(`/admin/courses/${courseId}`)
    } else {
      navigate(`/admin/courses/${courseId}`)
    }
  }

  const confirmLeave = () => {
    setShowLeaveWarning(false)
    if (pendingNavigation) {
      navigate(pendingNavigation)
    }
  }

  // Save settings
  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await updateCourseExam(examId, settings)
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

  // Calculate total points
  const totalPoints = localQuestions.reduce((sum, q) => sum + (q.points || 0), 0)

  // Current selected question
  const currentQuestion = selectedIndex !== null ? localQuestions[selectedIndex] : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
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
                onClick={handleNavigateBack}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{exam?.title}</h1>
                <p className="text-sm text-gray-500">
                  {localQuestions.length} questions • {totalPoints} points
                  {settings.timeLimit && ` • ${settings.timeLimit} min`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Unsaved changes indicator */}
              {hasUnsavedChanges() && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-yellow-100 text-yellow-700">
                  <AlertCircle className="w-4 h-4" />
                  Unsaved changes
                </div>
              )}
              
              {/* Publish status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                settings.isPublished 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {settings.isPublished ? (
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
              
              {/* Save All Button */}
              <button
                onClick={handleSaveAll}
                disabled={saving || !hasUnsavedChanges()}
                className="flex items-center gap-2 px-5 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save All
                  </>
                )}
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
                  onClick={handleAddQuestion}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f]"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>
              
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                {localQuestions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No questions yet
                  </div>
                ) : (
                  <div className="divide-y">
                    {localQuestions.map((q, idx) => {
                      const hasError = !q.question.trim() || 
                        q.choices.filter(c => c.text.trim()).length < 2 ||
                        !q.choices.some(c => c.isCorrect && c.text.trim())
                      
                      return (
                        <button
                          key={q.id || q.tempId}
                          onClick={() => setSelectedIndex(idx)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedIndex === idx ? 'bg-orange-50 border-l-4 border-[#f7941d]' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              hasError ? 'bg-red-100 text-red-600' : 'bg-gray-100'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">
                                {q.question || 'Untitled question'}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {q.points} pts • {q.choices.filter(c => c.text.trim()).length} choices
                              </p>
                            </div>
                            {!hasError && q.choices.some(c => c.isCorrect) && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                            {hasError && (
                              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {/* Discard changes button */}
              {hasUnsavedChanges() && (
                <div className="p-4 border-t">
                  <button
                    onClick={handleDiscardChanges}
                    className="w-full px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Discard Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Question Editor */}
          <div className="flex-1">
            {currentQuestion ? (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Question #{selectedIndex + 1}
                    </label>
                    <button
                      onClick={() => handleDeleteQuestion(selectedIndex)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                  <textarea
                    value={currentQuestion.question}
                    onChange={(e) => handleUpdateQuestion(selectedIndex, 'question', e.target.value)}
                    placeholder="Enter your question here..."
                    rows={3}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#f7941d] focus:border-[#f7941d] resize-none"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={currentQuestion.points}
                    onChange={(e) => handleUpdateQuestion(selectedIndex, 'points', parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#f7941d] focus:border-[#f7941d]"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Answer Choices
                    <span className="text-gray-400 font-normal ml-2">(Select the correct answer)</span>
                  </label>
                  <div className="space-y-3">
                    {currentQuestion.choices.map((choice, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleUpdateChoice(selectedIndex, idx, 'isCorrect', true)}
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
                            onChange={(e) => handleUpdateChoice(selectedIndex, idx, 'text', e.target.value)}
                            placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#f7941d] focus:border-[#f7941d] ${
                              choice.isCorrect ? 'border-green-300 bg-green-50' : ''
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation between questions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                    disabled={selectedIndex === 0}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedIndex + 1} of {localQuestions.length}
                  </span>
                  <button
                    onClick={() => setSelectedIndex(Math.min(localQuestions.length - 1, selectedIndex + 1))}
                    disabled={selectedIndex === localQuestions.length - 1}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No question selected</h3>
                <p className="text-gray-500 mb-4">Add a question to get started</p>
                <button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f]"
                >
                  Add Question
                </button>
              </div>
            )}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#f7941d]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#f7941d]"
                />
              </div>

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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#f7941d]"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no time limit</p>
              </div>

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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#f7941d]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Exam auto-submits if student exceeds this limit
                </p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isPublished}
                    onChange={(e) => setSettings({ ...settings, isPublished: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-[#f7941d] focus:ring-[#f7941d]"
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
                className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a87] disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors Modal */}
      {showErrors && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold">Cannot Save</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Please fix the following issues:</p>
              <ul className="space-y-2">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-red-600">
                    <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end rounded-b-xl">
              <button
                onClick={() => setShowErrors(false)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Warning Modal */}
      {showLeaveWarning && (
        <ConfirmModal
          isOpen={showLeaveWarning}
          onClose={() => setShowLeaveWarning(false)}
          onConfirm={confirmLeave}
          title="Unsaved Changes"
          message="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
          confirmText="Leave"
          confirmStyle="danger"
        />
      )}
    </div>
  )
}
