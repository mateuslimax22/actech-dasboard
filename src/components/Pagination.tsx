"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export const DEFAULT_PAGE_SIZE = 20;

type PaginationProps = {
  page: number;
  pageSize?: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function getTotalPages(total: number, pageSize = DEFAULT_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize = DEFAULT_PAGE_SIZE,
): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function Pagination({
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  total,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (total <= 0) {
    return null;
  }

  const totalPages = getTotalPages(total, pageSize);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);
  const canPaginate = totalPages > 1;

  return (
    <div
      className={`flex shrink-0 flex-col gap-3 border-t border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-xs text-muted">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary h-9 px-3"
          disabled={!canPaginate || safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} strokeWidth={1.75} aria-hidden />
          Anterior
        </button>
        <span className="min-w-[4.5rem] text-center text-xs text-secondary">
          {safePage} / {totalPages}
        </span>
        <button
          type="button"
          className="btn-secondary h-9 px-3"
          disabled={!canPaginate || safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Próxima página"
        >
          Próxima
          <ChevronRight size={15} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </div>
  );
}
