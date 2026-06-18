import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRoles } from './roles-provider'

export function RolesPrimaryButtons() {
  const { setOpen } = useRoles()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('create')}>
        <span>新建角色</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
