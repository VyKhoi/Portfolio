import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSaveShortcut, useToast, useUnsaved } from './ui'
import { CONTENT_KEYS } from './publish'

/**
 * Local copy of server data for an edit form: tracks unsaved edits, warns before leaving,
 * saves with Ctrl+S, and after saving refreshes the content queries + publish state.
 */
export function useEditForm<T>(
  source: T | undefined,
  save: (value: T) => Promise<unknown>,
  { savedText = 'Đã lưu. Trang sẽ cập nhật trong khoảng 30 phút.', onSaved }: { savedText?: string; onSaved?: () => void } = {},
) {
  const qc = useQueryClient()
  const toast = useToast()
  const [value, setValue] = useState<T | undefined>(source)
  const baseline = useRef<string>(JSON.stringify(source))

  // New data from the server (first load, or after a save) replaces the form unless the user is mid-edit
  useEffect(() => {
    if (source === undefined) return
    setValue((current) => (current === undefined || JSON.stringify(current) === baseline.current ? source : current))
    baseline.current = JSON.stringify(source)
  }, [source])

  const dirty = value !== undefined && JSON.stringify(value) !== baseline.current
  useUnsaved(dirty)

  const mutation = useMutation({
    mutationFn: () => save(value as T),
    onSuccess: () => {
      baseline.current = JSON.stringify(value)
      toast.ok(savedText)
      for (const key of CONTENT_KEYS) qc.invalidateQueries({ queryKey: [key] })
      onSaved?.()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const submit = useCallback(() => {
    if (dirty && !mutation.isPending) mutation.mutate()
  }, [dirty, mutation])
  useSaveShortcut(submit, dirty)

  const reset = () => setValue(JSON.parse(baseline.current))
  const patch = (changes: Partial<T>) => setValue((v) => ({ ...(v as T), ...changes }))

  return { value, setValue, patch, dirty, saving: mutation.isPending, submit, reset }
}
