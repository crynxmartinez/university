import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Clock, AlertTriangle, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Send, Loader2
} from 'lucide-react'
import { useToast } from '../../components/Toast'
import { 
  startExam, saveAnswer, recordTabSwitch, submitExam, getExamResult 
} from '../../api/exams'

export default function StudentExam() {
  const { id: courseSlug, examId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  // Exam state
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: choiceId }
  const [submitting, setSubmitting] = useState(false)

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(null) // in seconds
  const [timerWarning, setTimerWarning] = useState(false)

  // Tab switch state
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [maxTabSwitch, setMaxTabSwitch] = useState(3)
  const [showTabWarning, setShowTabWarning] = useState(false)

  // Result state
  const [result, setResult] = useState(null)
  const [showResult, setShowResult] = useState(false)

  // Start exam on mount
  useEffect(() => {
    handleStartExam()
  }, [examId])

  const handleStartExam = async () => {
    setLoading(true)
    try {
      const data = await startExam(examId)
      
      // Check if already submitted
      if (data.attempt?.status !== 'IN_PROGRESS') {
        // Load result instead
        const resultData = await getExamResult(data.attempt.id)
        setResult(resultData)
        setShowResult(true)
        setLoading(false)
        return
      }

      setExam(data.exam)
      setAttempt(data.attempt)
      setQuestions(data.exam.questions || [])
      setTabSwitchCount(data.attempt.tabSwitchCount || 0)
      setMaxTabSwitch(data.exam.maxTabSwitch || 3)

      // Calculate time remaining
      if (data.exam.timeLimit) {
        const startTime = new Date(data.attempt.startedAt).getTime()
        const elapsed = (Date.now() - startTime) / 1000 / 60 // minutes
        const remaining = Math.max(0, data.exam.timeLimit - elapsed)
        setTimeRemaining(Math.floor(remaining * 60)) // convert to seconds
      }
    } catch (error) {
      console.error('Failed to start exam:', error)
      if (error.response?.data?.error === 'You have already completed this exam') {
        toast.error('You have already completed this exam')
        navigate(`/student/courses/${courseSlug}`)
      } else {
        toast.error('Failed to load exam')
      }
    } finally {
      setLoading(false)
    }
  }

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || showResult) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleSubmit(true)
          return 0
        }
        // Warning when 2 minutes left
        if (prev <= 120 && !timerWarning) {
          setTimerWarning(true)
          toast.error('2 minutes remaining!')
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, showResult])

  // Tab switch detection
  useEffect(() => {
    if (!attempt || showResult) return

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          const response = await recordTabSwitch(attempt.id)
          
          if (response.flagged) {
            // Exam was auto-submitted
            toast.error('Exam auto-submitted due to too many tab switches')
            const resultData = await getExamResult(attempt.id)
            setResult(resultData)
            setShowResult(true)
          } else {
            setTabSwitchCount(response.tabSwitchCount)
            setShowTabWarning(true)
            toast.error(`Warning: ${response.remaining} tab switches remaining`)
          }
        } catch (error) {
          console.error('Failed to record tab switch:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [attempt, showResult])

  // Save answer
  const handleSelectAnswer = async (questionId, choiceId) => {
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }))
    
    try {
      await saveAnswer(attempt.id, questionId, choiceId)
    } catch (error) {
      console.error('Failed to save answer:', error)
      // Don't show error to avoid disrupting the exam
    }
  }

  // Submit exam
  const handleSubmit = async (isAutoSubmit = false) => {
    if (submitting) return
    
    if (!isAutoSubmit) {
      const unanswered = questions.filter(q => !answers[q.id]).length
      if (unanswered > 0) {
        const confirm = window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)
        if (!confirm) return
      }
    }

    setSubmitting(true)
    try {
      const submitResult = await submitExam(attempt.id)
      const resultData = await getExamResult(attempt.id)
      setResult(resultData)
      setShowResult(true)
      toast.success('Exam submitted successfully!')
    } catch (error) {
      console.error('Failed to submit exam:', error)
      toast.error('Failed to submit exam')
    } finally {
      setSubmitting(false)
    }
  }

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Current question
  const currentQuestion = questions[currentQuestionIndex]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    )
  }

  // Show result view
  if (showResult && result) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Result Header */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-6 text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              result.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {result.passed ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {result.passed ? 'Congratulations!' : 'Keep Trying!'}
            </h1>
            <p className="text-gray-600 mb-4">{result.examTitle}</p>
            
            <div className="flex items-center justify-center gap-8 mb-6">
              <div>
                <p className="text-4xl font-bold text-gray-900">{result.score}</p>
                <p className="text-sm text-gray-500">out of {result.totalPossible}</p>
              </div>
              <div className={`text-4xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                {result.percentage}%
              </div>
            </div>

            {result.status === 'FLAGGED' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  This exam was flagged due to too many tab switches
                </p>
              </div>
            )}

            <button
              onClick={() => navigate(`/student/courses/${courseSlug}`)}
              className="px-6 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4a6f] transition"
            >
              Back to Course
            </button>
          </div>

          {/* Question Review */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Question Review</h2>
            <div className="space-y-6">
              {result.questions?.map((q, idx) => (
                <div key={q.id} className={`p-4 rounded-lg border ${
                  q.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      q.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{q.question}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {q.earnedPoints}/{q.points} points
                      </p>
                    </div>
                  </div>
                  <div className="ml-9 space-y-2">
                    {q.choices?.map((choice) => (
                      <div
                        key={choice.id}
                        className={`p-2 rounded-lg text-sm ${
                          choice.isCorrect
                            ? 'bg-green-200 text-green-800 font-medium'
                            : choice.isSelected && !choice.isCorrect
                            ? 'bg-red-200 text-red-800'
                            : 'bg-white text-gray-600'
                        }`}
                      >
                        {choice.text}
                        {choice.isCorrect && ' ✓'}
                        {choice.isSelected && !choice.isCorrect && ' ✗'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{exam?.title}</h1>
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Tab switch warning */}
              {tabSwitchCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  {maxTabSwitch - tabSwitchCount} switches left
                </div>
              )}
              
              {/* Timer */}
              {timeRemaining !== null && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
                  timerWarning ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <Clock className="w-5 h-5" />
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Question Navigation Sidebar */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <p className="text-sm font-medium text-gray-700 mb-3">Questions</p>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                      currentQuestionIndex === idx
                        ? 'bg-orange-500 text-white'
                        : answers[q.id]
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">
                  Answered: {Object.keys(answers).length}/{questions.length}
                </p>
                <button
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-8">
              {currentQuestion && (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">Question {currentQuestionIndex + 1}</span>
                      <span className="text-sm font-medium text-orange-600">{currentQuestion.points} points</span>
                    </div>
                    <h2 className="text-xl font-medium text-gray-900">{currentQuestion.question}</h2>
                  </div>

                  <div className="space-y-3 mb-8">
                    {currentQuestion.choices?.map((choice, idx) => (
                      <button
                        key={choice.id}
                        onClick={() => handleSelectAnswer(currentQuestion.id, choice.id)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition ${
                          answers[currentQuestion.id] === choice.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            answers[currentQuestion.id] === choice.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-gray-900">{choice.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Previous
                    </button>
                    
                    {currentQuestionIndex < questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                      >
                        Next
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubmit()}
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Submit Exam
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switch Warning Modal */}
      {showTabWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Warning: Tab Switch Detected</h2>
            <p className="text-gray-600 mb-4">
              You have switched tabs or windows. You have <strong>{maxTabSwitch - tabSwitchCount}</strong> switches remaining before your exam is automatically submitted.
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
