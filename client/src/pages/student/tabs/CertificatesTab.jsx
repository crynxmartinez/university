import { Shield, Download } from 'lucide-react'
import { useToast } from '../../../components/Toast'
import { getMyCertificates } from '../../../api/certificates'

export default function CertificatesTab({
  certificates,
  setCertificates,
  loadingCertificates,
  setLoadingCertificates
}) {
  const toast = useToast()

  const handleRefresh = async () => {
    setLoadingCertificates(true)
    try {
      const certs = await getMyCertificates()
      setCertificates(certs)
    } catch (error) {
      console.error('Error fetching certificates:', error)
      toast.error('Failed to load certificates')
    } finally {
      setLoadingCertificates(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Certificates</h2>
          <p className="text-sm text-gray-500">View and download your earned certificates</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
        >
          <Shield className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loadingCertificates ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading certificates...</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="py-12 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No certificates yet</p>
          <p className="text-sm text-gray-400">Complete courses and programs to earn certificates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map(cert => (
            <div key={cert.id} className="border-2 border-[#f7941d] rounded-xl p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-[#f7941d]" />
                    <span className="text-xs font-semibold text-[#f7941d] uppercase tracking-wide">
                      Certificate
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {cert.courseOffering?.masterCourse?.title || cert.programOffering?.masterProgram?.title || 'Certificate'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {cert.courseOffering ? 'Course Certificate' : 'Program Certificate'}
                    {(cert.courseOffering?.semester || cert.programOffering?.semester) && (
                      <span className="ml-1 text-gray-400">· {(cert.courseOffering?.semester || cert.programOffering?.semester)?.name}</span>
                    )}
                  </p>
                </div>
                {cert.grade && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#1e3a5f]">{cert.grade}</div>
                    {cert.gpa && (
                      <div className="text-xs text-gray-500">GPA: {cert.gpa.toFixed(2)}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Certificate No:</span>
                  <span className="font-mono font-semibold text-gray-900">{cert.certificateNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Issued:</span>
                  <span className="text-gray-900">
                    {new Date(cert.issuedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Completed:</span>
                  <span className="text-gray-900">
                    {new Date(cert.completionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center gap-3">
                <a
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
                >
                  <Download className="w-4 h-4" />
                  Download / View
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cert.certificateNumber)
                    toast.success('Certificate number copied!')
                  }}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition"
                >
                  Copy #
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
