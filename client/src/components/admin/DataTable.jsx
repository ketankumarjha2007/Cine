import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from '../common/EmptyState.jsx';
import Spinner from '../common/Spinner.jsx';
import './DataTable.css';

export default function DataTable({
  columns, // [{ key, header, render?, sortable? }]
  data = [],
  loading = false,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  actions = null
}) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="datatable-root">
      {/* Top Bar */}
      <div className="datatable-top-bar">
        {onSearchChange && (
          <div className="datatable-search-wrapper">
            <Search size={16} className="datatable-search-icon" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="datatable-search-input"
            />
          </div>
        )}
        {actions && <div className="datatable-top-actions">{actions}</div>}
      </div>

      {/* Table Container */}
      <div className="datatable-responsive-container">
        {loading ? (
          <div className="datatable-loading-overlay">
            <Spinner size="lg" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            title="No records found"
            description="Try adjusting your search criteria or add new entries."
          />
        ) : (
          <table className="datatable-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="datatable-th">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.id || idx} className="datatable-tr">
                  {columns.map((col) => (
                    <td key={col.key} data-label={col.header} className="datatable-td">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {onPageChange && total > pageSize && (
        <div className="datatable-pagination">
          <span className="pagination-info">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="pagination-buttons">
            <button
              type="button"
              className="pagination-btn"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="pagination-current-page">{page} / {totalPages}</span>
            <button
              type="button"
              className="pagination-btn"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
