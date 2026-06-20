export const POST_STATUS = {
  draft: { label: '草稿', variant: 'secondary' as const },
  under_review: { label: '审核中', variant: 'default' as const, className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
  published: { label: '已发布', variant: 'default' as const },
  rejected: { label: '已拒绝', variant: 'destructive' as const },
  hidden: { label: '已隐藏', variant: 'outline' as const },
} as const

export type PostStatus = keyof typeof POST_STATUS
