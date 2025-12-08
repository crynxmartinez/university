import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Plus, Trash2, Edit3, Save, X, Check, 
  GripVertical, ToggleLeft, ToggleRight, Clock, AlertTriangle
} from 'lucide-react'
import { 
  getProgramExam, updateProgramExam, toggleProgramExamPublish,
  addProgramExamQuestion, updateProgramExamQuestion, deleteProgramExamQuestion
} from '../../api/adminProgramExams'
import { useToast, ConfirmModal } from '../../components/Toast'

export default function AdminProgramExamBuilder() {
  const { id: programId, examId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Exam settings
  const [examSettings, setExamSettings] = useState({
    title: '',
    description: '',
    timeLimit: null,
    maxTabSwitch: 3
  })
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Question editing
  const [editingQuestion, setEditingQuestion] = useState(null)
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
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [deleteQuestionConfirm, setDeleteQuestionConfirm] = useState(null)

  useEffect(() => {
    fetchExam()
  }, [examId])

  const fetchExam = async () => {
    try {
      const data = await getProgramExam(examId)
      setExam(data)
      setExamSettings({
        title: data.title,
        description: data.description || '',
        timeLimit: data.timeLimit,
        maxTabSwitch: data.maxTabSwitch || 3
      })
    } catch (error) {
      console.error('Failed to fetch exam:', error)
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await updateProgramExam(examId, examSettings)
      toast.success('Exam settings saved')
      fetchExam()
      setShowSettingsModal(false)
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async () => {
    try {
      await toggleProgramExamPublish(examId)
      toast.success(exam.isPublished ? 'Exam unpublished' : 'Exam published')
      fetchExam()
    } catch (error) {
      toast.error('Failed to toggle publish status')
    }
  }

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null)
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
    setShowQuestionModal(true)
  }

  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q)
    setQuestionForm({
      question: q.question,
      points: q.points,
      choices: q.choices?.length > 0 ? q.choices.map(c => ({ text: c.text, isCorrect: c.isCorrect })) : [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    })
    setShowQuestionModal(true)
  }

  const handleSaveQuestion = async () => {
    // Validate
    if (!questionForm.question.trim()) {
      toast.error('Question text is required')
      return
    }
    
    const filledChoices = questionForm.choices.filter(c => c.text.trim())
    if (filledChoices.length < 2) {
      toast.error('At least 2 choices are required')
      return
    }
    
    const hasCorrect = questionForm.choices.some(c => c.isCorrect && c.text.trim())
    if (!hasCorrect) {
      toast.error('Please mark at least one correct answer')
      return
    }

    setSaving(true)
    try {
      const data = {
        question: questionForm.question,
        points: questionForm.points,
        choices: questionForm.choices.filter(c => c.text.trim())
      }

      if (editingQuestion) {
        await updateProgramExamQuestion(editingQuestion.id, data)
        toast.success('Question updated')
      } else {
        await addProgramExamQuestion(examId, data)
        toast.success('Question added')
      }
      
      fetchExam()
      setShowQuestionModal(false)
    } catch (error) {
      toast.error('Failed to save question')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async () => {
    try {
      await deleteProgramExamQuestion(deleteQuestionConfirm)
      toast.success('Question deleted')
      fetchExam()
    } catch (error) {
      toast.error('Failed to delete question')
    } finally {
      setDeleteQuestionConfirm(null)
    }
  }

  const handleChoiceChange = (index, field, value) => {
    setQuestionForm(prev => ({
      ...prev,
      choices: prev.choices.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      )
    }))
  }

  const handleSetCorrect = (index) => {
    setQuestionForm(prev => ({
      ...prev,
      choices: prev.choices.map((c, i) => ({
        ...c,
        isCorrect: i === index
      }))
    }))
  }

  const addChoice = () => {
    if (questionForm.choices.length < 6) {
      setQuestionForm(prev => ({
        ...prev,
        choices: [...prev.choices, { text: '', isCorrect: false }]
      }))
    }
  }

  const removeChoice = (index) => {
    if (questionForm.choices.length > 2) {
      setQuestionForm(prev => ({
        ...prev,
        choices: prev.choices.filter((_, i) => i !== index)
      }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Exam not found</h2>
          <button onClick={() => navigate(`/admin/programs/${programId}`)} className="mt-4 text-[#f7941d] hover:underline">
            Back to Program
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/admin/programs/${programId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-500">
                  {exam.questions?.length || 0} questions • {exam.totalPoints} points
                  {exam.timeLimit && ` • ${exam.timeLimit} min`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Settings
              </button>
              <button
                onClick={handleTogglePublish}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  exam.isPublished 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {exam.isPublished ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {exam.isPublished ? 'Published' : 'Draft'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Add Question Button */}
        <div className="mb-6">
          <button
            onClick={handleOpenAddQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a87]"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        {/* Questions List */}
        {exam.questions?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-500 mb-4">Add questions to your exam</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exam.questions?.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{q.question}</p>
                      <p className="text-sm text-gray-500 mt-1">{q.points} points</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-2 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 rounded-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteQuestionConfirm(q.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Choices */}
                <div className="ml-11 space-y-2">
                  {q.choices?.map((choice, cIdx) => (
                    <div
                      key={choice.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        choice.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        choice.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + cIdx)}
                      </span>
                      <span className={choice.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}>
                        {choice.text}
                      </span>
                      {choice.isCorrect && (
                        <Check className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Exam Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={examSettings.title}
                  onChange={e => setExamSettings(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={examSettings.description}
                  onChange={e => setExamSettings(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time Limit (minutes)</label>
                <input
                  type="number"
                  value={examSettings.timeLimit || ''}
                  onChange={e => setExamSettings(prev => ({ ...prev, timeLimit: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="No limit"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Tab Switches</label>
                <input
                  type="number"
                  value={examSettings.maxTabSwitch}
                  onChange={e => setExamSettings(prev => ({ ...prev, maxTabSwitch: parseInt(e.target.value) || 3 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSettingsModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">
                Cancel
              </button>
              <button onClick={handleSaveSettings} disabled={saving} className="flex-1 py-2 bg-[#1e3a5f] text-white rounded-lg disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingQuestion ? 'Edit Question' : 'Add Question'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <textarea
                  value={questionForm.question}
                  onChange={e => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                  rows={3}
                  placeholder="Enter your question..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Points</label>
                <input
                  type="number"
                  value={questionForm.points}
                  onChange={e => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Answer Choices</label>
                  {questionForm.choices.length < 6 && (
                    <button onClick={addChoice} className="text-sm text-[#f7941d] hover:underline">
                      + Add Choice
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">Click the circle to mark the correct answer</p>
                
                <div className="space-y-3">
                  {questionForm.choices.map((choice, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSetCorrect(idx)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                          choice.isCorrect 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </button>
                      <input
                        type="text"
                        value={choice.text}
                        onChange={e => handleChoiceChange(idx, 'text', e.target.value)}
                        placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                        className={`flex-1 px-4 py-2 border rounded-lg ${
                          choice.isCorrect ? 'border-green-300 bg-green-50' : 'border-gray-300'
                        }`}
                      />
                      {questionForm.choices.length > 2 && (
                        <button
                          onClick={() => removeChoice(idx)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowQuestionModal(false)} 
                className="flex-1 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveQuestion} 
                disabled={saving}
                className="flex-1 py-2 bg-[#1e3a5f] text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingQuestion ? 'Update' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteQuestionConfirm}
        title="Delete Question"
        message="Are you sure you want to delete this question?"
        onConfirm={handleDeleteQuestion}
        onCancel={() => setDeleteQuestionConfirm(null)}
      />
    </div>
  )
}
