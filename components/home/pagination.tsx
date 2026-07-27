"use client"

import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// 번호 버튼은 최대 이만큼만 보여주고, 그 이후 페이지는 Next 화살표로만 이동한다.
const MAX_VISIBLE_PAGE_NUMBERS = 5

export function HomePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const visiblePageNumbers = Math.min(totalPages, MAX_VISIBLE_PAGE_NUMBERS)

  return (
    <PaginationRoot className="mt-section-gap">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          />
        </PaginationItem>
        {Array.from({ length: visiblePageNumbers }, (_, i) => i + 1).map((n) => (
          <PaginationItem key={n}>
            <PaginationLink isActive={page === n} onClick={() => onPageChange(n)}>
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            disabled={page === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  )
}
