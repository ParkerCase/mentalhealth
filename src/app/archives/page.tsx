// src/app/archives/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Article } from '@/lib/types'

export default function Archives() {
  const [articles, setArticles] = useState<Article[]>([])
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchArticles()
  }, [selectedCategory])

  const handleImageError = (articleId: string) => {
    setImageErrors(prev => new Set(prev).add(articleId))
  }

  const fetchArticles = async () => {
    setIsLoading(true)
    try {
      // Fetch articles
      let query = supabase
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
          updated_at
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error

      // Process data to match our Article type
      const processedData = data?.map((item: any) => ({
        ...item,
        // Convert profiles array to single object if needed
        profiles: item.profiles && Array.isArray(item.profiles) && item.profiles.length > 0
          ? {
              username: item.profiles[0]?.username,
              avatar_url: item.profiles[0]?.avatar_url
            }
          : item.profiles
      })) as Article[]

      // Find featured article and remaining articles
      const featured = processedData?.find(article => article.featured)
      const regular = processedData?.filter(article => !article.featured)

      setFeaturedArticle(featured || null)
      setArticles(regular || [])

      // Extract unique categories
      const categoriesSet = new Set<string>()
      processedData?.forEach(article => {
        if (article.category) categoriesSet.add(article.category)
      })
      setCategories(Array.from(categoriesSet))
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category)
  }

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Resources & Archives</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Featured Article */}
            {featuredArticle && (
              <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
                <div className="relative h-64 w-full">
                  {featuredArticle.thumbnail_url && !imageErrors.has(featuredArticle.id) ? (
                    <Image
                      src={featuredArticle.thumbnail_url}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(featuredArticle.id)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-xl">
                        {featuredArticle.title === 'Divine Masculine: 11 Key Qualities Explained' ? 'Divine Masculine' : 'Featured Article'}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 bg-blue-600 text-white px-4 py-1">
                    Featured
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2">
                    <Link href={`/archives/${featuredArticle.id}`}>
                      {featuredArticle.title}
                    </Link>
                  </h2>
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <span>{format(new Date(featuredArticle.created_at), 'MMMM d, yyyy')}</span>
                    <span className="mx-2">•</span>
                    <span>{featuredArticle.category}</span>
                  </div>
                  <p className="text-gray-700 mb-4">
                    {truncateText(featuredArticle.content, 300)}
                  </p>
                  <Link
                    href={`/archives/${featuredArticle.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Read more
                  </Link>
                </div>
              </div>
            )}

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.length > 0 ? (
                articles.map((article) => (
                  <div key={article.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="relative h-48 w-full">
                      {article.thumbnail_url && !imageErrors.has(article.id) ? (
                        <Image
                          src={article.thumbnail_url}
                          alt={article.title}
                          fill
                          className="object-cover"
                          onError={() => handleImageError(article.id)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {article.title === 'Divine Masculine: 11 Key Qualities Explained' ? 'Divine Masculine' : 'Article'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">
                        {article.title === 'Divine Masculine: 11 Key Qualities Explained' ? (
                          <a 
                            href="https://subconsciousservant.com/divine-masculine/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 transition-colors"
                          >
                            {article.title}
                          </a>
                        ) : (
                          <Link href={`/archives/${article.id}`}>
                            {article.title}
                          </Link>
                        )}
                      </h3>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <span>{format(new Date(article.created_at), 'MMMM d, yyyy')}</span>
                        <span className="mx-2">•</span>
                        <span>{article.category}</span>
                      </div>
                      <p className="text-gray-700 mb-3">
                        {truncateText(article.content, 150)}
                      </p>
                      {article.title === 'Divine Masculine: 11 Key Qualities Explained' ? (
                        <a 
                          href="https://subconsciousservant.com/divine-masculine/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Read full article →
                        </a>
                      ) : (
                        <Link
                          href={`/archives/${article.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Read more
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 bg-white shadow-md rounded-lg p-6 text-center">
                  <p className="text-gray-600">
                    {selectedCategory
                      ? `No articles found in the "${selectedCategory}" category.`
                      : 'No articles available.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <div className="bg-white shadow-md rounded-lg p-4 mb-6">
              <h3 style={{color: "#374151 "}}  className="text-lg font-semibold mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`block w-full text-left px-3 py-2 rounded ${
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No categories available</p>
                )}
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory('')}
                  className="mt-4 text-sm text-blue-600 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Popular Resources */}
            <div className="bg-white shadow-md rounded-lg p-4">
              <h3 style={{color: "#374151 "}} className="text-lg font-semibold mb-3">Popular Resources</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="https://subconsciousservant.com/divine-masculine/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start hover:bg-gray-50 p-2 rounded-md"
                  >
                    <div className="bg-blue-100 text-blue-600 font-bold w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Divine Masculine: 11 Key Qualities Explained</h4>
                      <p className="text-sm text-gray-500">Understanding divine masculinity</p>
                    </div>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-start hover:bg-gray-50 p-2 rounded-md"
                  >
                    <div className="bg-blue-100 text-blue-600 font-bold w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Finding Support in Your Community</h4>
                      <p className="text-sm text-gray-500">A guide to local resources</p>
                    </div>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-start hover:bg-gray-50 p-2 rounded-md"
                  >
                    <div className="bg-blue-100 text-blue-600 font-bold w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Starting a Support Group</h4>
                      <p className="text-sm text-gray-500">Step-by-step guide</p>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}