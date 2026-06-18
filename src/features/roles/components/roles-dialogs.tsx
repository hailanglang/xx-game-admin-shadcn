import { RolesActionDialog } from './roles-action-dialog'
import { RolesDeleteDialog } from './roles-delete-dialog'
import { RolesPermissionDialog } from './roles-permission-dialog'
import { useRoles } from './roles-provider'

export function RolesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useRoles()
  return (
    <>
      <RolesActionDialog
        key='role-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      {currentRow && (
        <>
          <RolesActionDialog
            key={`role-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <RolesDeleteDialog
            key={`role-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <RolesPermissionDialog
            key={`role-permission-${currentRow.id}`}
            open={open === 'permission'}
            onOpenChange={() => {
              setOpen('permission')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
