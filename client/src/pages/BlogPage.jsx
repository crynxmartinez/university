import { Calendar, User, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "The Importance of Seeking Knowledge in Islam",
      excerpt: "Islam places great emphasis on seeking knowledge. The Prophet (PBUH) said, 'Seeking knowledge is an obligation upon every Muslim.'",
      date: "December 1, 2025",
      author: "ILM Admin",
      category: "Islamic Education"
    },
    {
      id: 2,
      title: "Tips for Memorizing the Quran",
      excerpt: "Memorizing the Quran is a noble goal. Here are some practical tips to help you on your journey of Hifz.",
      date: "November 25, 2025",
      author: "ILM Admin",
      category: "Quran Studies"
    },
    {
      id: 3,
      title: "Learning Arabic: A Gateway to Understanding Islam",
      excerpt: "Arabic is the language of the Quran. Learning it opens doors to deeper understanding of Islamic texts and teachings.",
      date: "November 20, 2025",
      author: "ILM Admin",
      category: "Arabic Language"
    },
    {
      id: 4,
      title: "The Role of Islamic Educators in the Community",
      excerpt: "Islamic educators play a vital role in preserving and transmitting knowledge to future generations.",
      date: "November 15, 2025",
      author: "ILM Admin",
      category: "Community"
    },
    {
      id: 5,
      title: "Tajweed: The Art of Beautiful Quran Recitation",
      excerpt: "Tajweed is the science of reciting the Quran correctly. Learn about its importance and basic rules.",
      date: "November 10, 2025",
      author: "ILM Admin",
      category: "Quran Studies"
    },
    {
      id: 6,
      title: "ILM Learning Center: Our Journey and Vision",
      excerpt: "Learn about the founding of ILM Learning Center and our vision for Islamic education in Palawan.",
      date: "November 5, 2025",
      author: "ILM Admin",
      category: "News"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-emerald-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-emerald-200">News, articles, and insights from ILM Learning Center</p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition">
                <div className="h-48 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                  <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-white font-bold">{post.id}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.date}
                      </span>
                    </div>
                    <button className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                      Read More <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-emerald-200 mb-8">
            Subscribe to our newsletter for the latest news and articles from ILM Learning Center.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-emerald-900 px-6 py-3 rounded-lg font-semibold transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}
