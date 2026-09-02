import React from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'

/**
 * Reusable Floating Bulk Actions Bar
 */
export function BulkActionBar({
  selectedCount,
  onPublish,
  onDelete,
  onClear,
  isBusy = false,
  itemLabel = 'Item',
}) {
  if (!selectedCount || selectedCount === 0) return null

  // A4: <600px — bar tidak overflow: max-width viewport, padding ringkas,
  // teks deskriptif disembunyikan (count badge tetap), posisi aman dari
  // home-indicator (safe-area). >=600px identik dengan sebelumnya.
  return (
    <div
      className="fixed left-1/2 z-50 bottom-20 tablet:bottom-6 flex w-max max-w-[95vw] -translate-x-1/2 items-center gap-3 overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/95 px-5 py-3 shadow-level-3 backdrop-blur-md no-scrollbar dark:bg-surface-container-high/95 animate-fade-up max-[599px]:max-w-[calc(100vw-20px)] max-[599px]:gap-2 max-[599px]:rounded-xl max-[599px]:px-3 max-[599px]:py-2"
    >
      <div className="flex items-center gap-2 border-r border-outline-variant/30 pr-3 max-[599px]:pr-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-label-caps font-bold text-on-primary">
          {selectedCount}
        </span>
        <span className="text-body-xs font-bold whitespace-nowrap text-on-surface show-from-tablet">
          {selectedCount} {itemLabel} Terpilih
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2 max-[599px]:gap-1.5">
        {onPublish && (
          <Button
            size="sm"
            variant="outline"
            onClick={onPublish}
            disabled={isBusy}
            className="rounded-xl text-body-xs font-bold text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
          >
            <Icon name="publish" size={16} className="mr-1" />
            Publikasikan
          </Button>
        )}

        {onDelete && (
          <Button
            size="sm"
            variant="danger"
            onClick={onDelete}
            disabled={isBusy}
            className="rounded-xl text-body-xs font-bold shadow-level-1 cursor-pointer"
          >
            <Icon name="delete" size={16} className="mr-1" />
            Hapus Terpilih
          </Button>
        )}

        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl px-2.5 py-1 text-label-caps font-bold text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            Batal
          </button>
        )}
      </div>
    </div>
  )
}
