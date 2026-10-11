import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BLOG_POSTS, getPostBySlug } from '@/lib/blog-data'
import { BlogArticleContent } from '@/components/marketing/BlogArticleContent'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post not found' }
  return { title: post.title, description: post.excerpt }
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return <BlogArticleContent post={post} />
}
