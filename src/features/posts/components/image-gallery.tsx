import { useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PostImageDto } from '@/api'

type ImageGalleryProps = {
  images: PostImageDto[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images?.length) {
    return (
      <div className='flex h-48 items-center justify-center rounded-lg bg-muted'>
        <div className='flex flex-col items-center gap-2 text-muted-foreground'>
          <ImageOff size={32} />
          <span className='text-sm'>暂无图片</span>
        </div>
      </div>
    )
  }

  const hasMultiple = images.length > 1

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className='relative overflow-hidden rounded-lg bg-muted'>
      <img
        src={images[currentIndex].imageUrl}
        alt={`图片 ${currentIndex + 1}`}
        className='h-64 w-full object-contain'
      />

      {hasMultiple && (
        <>
          <Button
            variant='ghost'
            size='icon'
            className='absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 hover:bg-background/80'
            onClick={goToPrev}
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 hover:bg-background/80'
            onClick={goToNext}
          >
            <ChevronRight size={20} />
          </Button>
        </>
      )}

      {hasMultiple && (
        <div className='absolute bottom-2 flex w-full justify-center gap-1.5'>
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                index === currentIndex
                  ? 'bg-primary'
                  : 'bg-primary/40 hover:bg-primary/60'
              )}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
