// src/app/archives/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

export default function ArticlePage() {
  const params = useParams()
  const [article, setArticle] = useState(null)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!params.id) return
    fetchArticle(params.id)
  }, [params.id])

  const fetchArticle = async (id) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('archives')
        .select(`
          id, 
          title, 
          content,
          category,
          tags,
          published,
          featured,
          thumbnail_url,
          created_at,
          updated_at,
          profiles(username, avatar_url)
        `)
        .eq('id', id)
        .eq('published', true)
        .single()

      if (error || !data) {
        console.error('Error fetching article:', error)
        return notFound()
      }

      setArticle(data)

      // Fetch related articles with the same category
      if (data.category) {
        const { data: related } = await supabase
          .from('archives')
          .select(`
            id, 
            title,
            thumbnail_url,
            created_at,
            category
          `)
          .eq('category', data.category)
          .eq('published', true)
          .neq('id', id)
          .limit(3)

        setRelatedArticles(related || [])
      }
    } catch (error) {
      console.error('Error fetching article:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!article) {
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/archives" className="text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Archives
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <article className="bg-white shadow-md rounded-lg overflow-hidden">
            {article.thumbnail_url && (
              <div className="relative h-96 w-full">
                <Image
                  src={article.thumbnail_url}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
              
              <div className="flex items-center text-gray-500 text-sm mb-6">
                <div className="flex items-center">
                  {article.profiles?.avatar_url ? (
                    <Image
                      src={article.profiles.avatar_url}
                      alt={article.profiles.username || 'Author'}
                      width={24}
                      height={24}
                      className="rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-full mr-2"></div>
                  )}
                  <span>{article.profiles?.username || 'Anonymous'}</span>
                </div>
                <span className="mx-2">•</span>
                <span>{format(new Date(article.created_at), 'MMMM d, yyyy')}</span>
                {article.category && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{article.category}</span>
                  </>
                )}
              </div>
              
              {/* Article content */}
              <div className="prose max-w-none">
                {/* In a real app, you'd parse markdown or HTML here */}
                {article.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Related Articles */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Related Articles</h3>
            {relatedArticles.length > 0 ? (
              <div className="space-y-4">
                {relatedArticles.map((relatedArticle) => (
                  <Link
                    key={relatedArticle.id}
                    href={`/archives/${relatedArticle.id}`}
                    className="block hover:bg-gray-50 rounded-md overflow-hidden"
                  >
                    <div className="flex">
                      {relatedArticle.thumbnail_url ? (
                        <div className="w-20 h-20 relative flex-shrink-0">
                          <Image
                            src={relatedArticle.thumbnail_url}
                            alt={relatedArticle.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 flex-shrink-0"></div>
                      )}
                      <div className="p-2">
                        <h4 className="font-medium text-gray-800 text-sm line-clamp-2">
                          {relatedArticle.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(relatedArticle.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No related articles found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}