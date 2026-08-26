import React from 'react'
import { Icon } from './Icon'

/**
 * Reusable Modern Pagination Component
 * Supports page size selector, item range counter, and responsive page buttons.
 */
export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 0],
  itemLabel = 'data',
}) {
  const isAll = pageSize === 0 || pageSize === 'Semua' || typeof pageSize !== 'number'
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalItems === 0) return null

  const startIndex = isAll ? 1 : Math.min(totalItems, (currentPage - 1) * pageSize + 1)
  const endIndex = isAll ? totalItems : Math.min(totalItems, currentPage * pageSize)

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/15 tablet:flex-row tablet:items-center tablet:justify-between text-body-xs text-on-surface-variant font-medium">
      {/* Left: Range Counter & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span>
          Menampilkan{' '}
          <strong className="text-on-surface font-bold">
            {startIndex}
          </strong>
          {' - '}
          <strong className="text-on-surface font-bold">
            {endIndex}
          </strong>{' '}
          dari <strong className="text-on-surface font-bold">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <>
            <span className="text-outline-variant">•</span>
            <div className="flex items-center gap-1">
              <span className="text-on-surface-variant">Per halaman:</span>
              {pageSizeOptions.map((size) => {
                const isSelected =
                  pageSize === size ||
                  (size === 0 && pageSize === 'Semua') ||
                  (size === 'Semua' && pageSize === 0)

                return (
                  <button
                    key={String(size)}
                    type="button"
                    onClick={() => {
                      onPageSizeChange(size === 'Semua' ? 0 : size)
                      onPageChange(1)
                    }}
                    className={`px-2 py-0.5 rounded-lg text-body-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {size === 0 ? 'Semua' : size}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      {!isAll && totalPages > 1 && (
        <div className="flex items-center gap-1 self-center tablet:self-auto">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-outline-variant/25 bg-surface-container-low text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer"
            title="Halaman Pertama"
          >
            <Icon name="first_page" size={16} />
          </button>

          {/* Prev Page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-outline-variant/25 bg-surface-container-low text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <Icon name="chevron_left" size={16} />
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalPages <= 7) return true
              if (page === 1 || page === totalPages) return true
              return Math.abs(page - currentPage) <= 1
            })
            .map((page, idx, arr) => {
              const prev = arr[idx - 1]
              const showEllipsis = prev && page - prev > 1
              const isSelected = currentPage === page

              return (
                <div key={page} className="flex items-center">
                  {showEllipsis && (
                    <span className="px-1 text-on-surface-variant font-bold">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onPageChange(page)}
                    className={`flex h-8 min-w-[32px] px-2 items-center justify-center rounded-xl text-body-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'border border-outline-variant/25 bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {page}
                  </button>
                </div>
              )
            })}

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-outline-variant/25 bg-surface-container-low text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer"
            title="Halaman Berikutnya"
          >
            <Icon name="chevron_right" size={16} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-outline-variant/25 bg-surface-container-low text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer"
            title="Halaman Terakhir"
          >
            <Icon name="last_page" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
