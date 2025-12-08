import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, Clock, AlertTriangle, CheckCircle, XCircle, 
  ChevronLeft, ChevronRight, Flag
} from 'lucide-react'
import { 
  startProgramExam, saveProgramExamAnswer, submitProgramExam,
  recordProgramTabSwitch, getProgramExamResult
} from '../../api/studentPrograms'
import { useToast, ConfirmModal } from '../../components/Toast'

export default function StudentProgramExam() {
  const { id: programId, examId } = useParams()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const attemptId = searchParams.get('attemptId')
  const navigate = useNavigate()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [currentAttemptId, setCurrentAttemptId] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(null)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [maxTabSwitch, setMaxTabSwitch] = useState(3)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (attemptId) {
      loadResult()
    } else {
      startExam()
    }
  }, [examId, attemptId])

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, result])

  // Tab switch detection
  useEffect(() => {
    if (result || !currentAttemptId) return

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          const res = await recordProgramTabSwitch(currentAttemptId)
          setTabSwitchCount(res.tabSwitchCount)
          if (res.flagged) {
            toast.error('Exam flagged due to excessive tab switching!')
          } else {
            toast.warning(`Tab switch detected! ${res.maxTabSwitch - res.tabSwitchCount} warnings left`)
          }
        } catch (error) {
          console.error('Failed to record tab switch:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [currentAttemptId, result])

  const loadResult = async () => {
    try {
      const data = await getProgramExamResult(attemptId)
      setResult(data)
    } catch (error) {
      console.error('Failed to load result:', error)
      toast.error('Failed to load exam result')
    } finally {
      setLoading(false)
    }
  }

  const startExam = async () => {
    try {
      const data = await startProgramExam(examId, sessionId)
      setExam(data.exam)
      setCurrentAttemptId(data.attemptId)
      setTabSwitchCount(data.tabSwitchCount || 0)
      setMaxTabSwitch(data.exam.maxTabSwitch || 3)
      
      if (data.exam.timeLimit) {
        const elapsed = Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000)
        const remaining = data.exam.timeLimit * 60 - elapsed
        setTimeLeft(Math.max(0, remaining))
      }
    } catch (error) {
      console.error('Failed to start exam:', error)
      toast.error(error.response?.data?.error || 'Failed to start exam')
      navigate(`/student/programs/${programId}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = async (questionId, choiceId) => {
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }))
    
    try {
      await saveProgramExamAnswer(currentAttemptId, questionId, choiceId)
    } catch (error) {
      console.error('Failed to save answer:', error)
    }
  }

  const handleSubmit = async (auto = false) => {
    if (submitting) return
    setSubmitting(true)
    setShowSubmitConfirm(false)

    try {
      const data = await submitProgramExam(currentAttemptId)
      toast.success(auto ? 'Time\'s up! Exam submitted.' : 'Exam submitted successfully!')
      
      // Load result
      const resultData = await getProgramExamResult(currentAttemptId)
      setResult(resultData)
    } catch (error) {
      console.error('Failed to submit exam:', error)
      toast.error('Failed to submit exam')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentQuestion = exam?.questions?.[currentQuestionIndex]
  const answeredCount = Object.keys(answers).length
  const totalQuestions = exam?.questions?.length || 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  // Result View
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Result Header */}
          <div className={`rounded-xl p-8 mb-8 text-white ${result.passed ? 'bg-green-600' : 'bg-red-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">{result.examTitle}</h1>
                <p className="text-white/80">Exam Completed</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{result.score}/{result.totalPoints}</p>
                <p className="text-xl">{Math.round(result.percentage)}%</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                  result.passed ? 'bg-white/20' : 'bg-white/20'
                }`}>
                  {result.passed ? '✓ Passed' : '✗ Failed'}
                </span>
              </div>
            </div>
          </div>

          {/* Question Review */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Question Review</h2>
            <div className="space-y-6">
              {result.questions?.map((q, idx) => (
                <div key={q.id} className={`p-4 rounded-lg ${q.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      q.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{q.question}</p>
                      <p className="text-sm text-gray-500">{q.earnedPoints}/{q.points} points</p>
                    </div>
                  </div>
                  <div className="ml-11 space-y-2">
                    {q.choices?.map((choice, cIdx) => (
                      <div
                        key={choice.id}
                        className={`p-3 rounded-lg flex items-center gap-3 ${
                          choice.isSelected && choice.isCorrect ? 'bg-green-200 border border-green-400' :
                          choice.isSelected && !choice.isCorrect ? 'bg-red-200 border border-red-400' :
                          'bg-white border border-gray-200'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          {String.fromCharCode(65 + cIdx)}
                        </span>
                        <span>{choice.text}</span>
                        {choice.isSelected && (
                          choice.isCorrect ? <CheckCircle className="w-5 h-5 text-green-600 ml-auto" /> :
                          <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate(`/student/programs/${programId}`)}
            className="w-full py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a87]"
          >
            Back to Program
          </button>
        </div>
      </div>
    )
  }

  // Exam View
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{exam?.title}</h1>
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {timeLeft !== null && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Flag className="w-4 h-4" />
                {tabSwitchCount}/{maxTabSwitch}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {currentQuestion && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center font-medium">
                  {currentQuestionIndex + 1}
                </span>
                <span className="text-sm text-gray-500">{currentQuestion.points} points</span>
              </div>
              <p className="text-lg text-gray-900">{currentQuestion.question}</p>
            </div>

            <div className="space-y-3">
              {currentQuestion.choices?.map((choice, idx) => (
                <button
                  key={choice.id}
                  onClick={() => handleAnswerSelect(currentQuestion.id, choice.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left flex items-center gap-3 transition ${
                    answers[currentQuestion.id] === choice.id
                      ? 'border-[#f7941d] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    answers[currentQuestion.id] === choice.id
                      ? 'bg-[#f7941d] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-gray-900">{choice.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {exam?.questions?.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium ${
                  idx === currentQuestionIndex
                    ? 'bg-[#1e3a5f] text-white'
                    : answers[exam.questions[idx].id]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Exam
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{answeredCount}/{totalQuestions} answered</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#f7941d] transition-all"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Submit Confirmation */}
      <ConfirmModal
        isOpen={showSubmitConfirm}
        title="Submit Exam"
        message={`You have answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`}
        onConfirm={() => handleSubmit(false)}
        onCancel={() => setShowSubmitConfirm(false)}
        confirmText="Submit"
        confirmColor="green"
      />
    </div>
  )
}
