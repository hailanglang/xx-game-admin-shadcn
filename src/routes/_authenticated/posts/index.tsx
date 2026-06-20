import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Posts } from '@/features/posts'

const postsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(20),
  keyword: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/posts/')({
  validateSearch: postsSearchSchema,
  component: Posts,
})
