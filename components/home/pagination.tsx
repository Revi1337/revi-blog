"use client"

import * as React from "react"

import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// 번호 버튼은 최대 이만큼만 보여주고, 그 이후 페이지는 Next 화살표로만 이동한다.
const MAX_VISIBLE_PAGE_NUMBERS = 10

export function HomePagination({ totalPages }: { totalPages: number }) {
  const [page, setPage] = React.useState(1)
  const visiblePageNumbers = Math.min(totalPages, MAX_VISIBLE_PAGE_NUMBERS)

  return (
    <PaginationRoot className="mt-section-gap">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          />
        </PaginationItem>
        {Array.from({ length: visiblePageNumbers }, (_, i) => i + 1).map((n) => (
          <PaginationItem key={n}>
            <PaginationLink isActive={page === n} onClick={() => setPage(n)}>
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  )
}
