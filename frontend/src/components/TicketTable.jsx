import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import SlaTimer from './SlaTimer';
import {
  Search,
  Filter,
  ExternalLink,
  AlertCircle,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

const TicketTable = ({
  tickets = [],
  loading = false,
  showAssignee = true,
  emptyMessage = 'No incidents match the selected search or filter criteria.',
}) => {
  const { user } = useAuth();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set();
    tickets.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [tickets]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered and Sorted Tickets
  const processedTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        // Search
        const term = searchTerm.toLowerCase();
        const matchSearch =
          !searchTerm ||
          t.ticket_number?.toLowerCase().includes(term) ||
          t.title?.toLowerCase().includes(term) ||
          t.category?.toLowerCase().includes(term) ||
          t.assignee_name?.toLowerCase().includes(term) ||
          t.creator_name?.toLowerCase().includes(term);

        // Status
        const matchStatus = !statusFilter || t.status === statusFilter;

        // Priority
        const matchPriority = !priorityFilter || t.priority === priorityFilter;

        // Category
        const matchCategory = !categoryFilter || t.category === categoryFilter;

        // Assignee
        let matchAssignee = true;
        if (assigneeFilter === 'unassigned') {
          matchAssignee = !t.assigned_to;
        } else if (assigneeFilter === 'assigned') {
          matchAssignee = Boolean(t.assigned_to);
        }

        return matchSearch && matchStatus && matchPriority && matchCategory && matchAssignee;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (sortField === 'created_at' || sortField === 'sla_deadline') {
          valA = new Date(valA || 0).getTime();
          valB = new Date(valB || 0).getTime();
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, assigneeFilter, sortField, sortOrder]);

  // Pagination Slice
  const totalItems = processedTickets.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTickets.slice(start, start + pageSize);
  }, [processedTickets, currentPage, pageSize]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setAssigneeFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchTerm || statusFilter || priorityFilter || categoryFilter || assigneeFilter
  );

  // CSV Export utility
  const handleExportCSV = () => {
    if (processedTickets.length === 0) return;

    const headers = [
      'Ticket Number',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Created By',
      'Assigned Engineer',
      'Created At',
      'SLA Deadline',
      'Overdue',
      'Resolution Notes',
    ];

    const rows = processedTickets.map((t) => [
      `"${t.ticket_number || ''}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.category || ''}"`,
      `"${t.priority || ''}"`,
      `"${t.status || ''}"`,
      `"${t.creator_name || t.created_by || ''}"`,
      `"${t.assignee_name || (t.assigned_to ? 'Engineer #' + t.assigned_to : 'Unassigned')}"`,
      `"${t.created_at || ''}"`,
      `"${t.sla_deadline || ''}"`,
      `"${t.is_overdue ? 'Yes' : 'No'}"`,
      `"${(t.resolution_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `incidents_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border overflow-hidden">
      {/* Search and Filters Toolbar */}
      <div className="p-4 sm:p-5 border-b border-dark-border bg-dark-card/90 flex flex-col gap-3.5">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, title, category, assignee..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-navy-900 border border-dark-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition"
            />
          </div>

          {/* Quick Actions (Export & Clear) */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-dark-surface hover:bg-dark-hover border border-dark-border rounded-xl transition"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                Clear
              </button>
            )}

            <button
              onClick={handleExportCSV}
              disabled={processedTickets.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-dark-surface hover:bg-dark-hover border border-dark-border rounded-xl shadow-sm transition disabled:opacity-40"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-brand-accent" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Selectors Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-navy-900 border border-dark-border rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-brand-primary transition"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-navy-900 border border-dark-border rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-brand-primary transition"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-navy-900 border border-dark-border rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-brand-primary transition"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Assignee Filter */}
          {showAssignee && (
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-navy-900 border border-dark-border rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-brand-primary transition"
            >
              <option value="">All Assignments</option>
              <option value="assigned">Assigned to Engineer</option>
              <option value="unassigned">Unassigned Only</option>
            </select>
          )}

          <div className="ml-auto text-[11px] text-dark-muted font-mono">
            {totalItems} incident{totalItems === 1 ? '' : 's'} found
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-dark-surface/90 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-dark-border">
            <tr>
              <th
                onClick={() => handleSort('ticket_number')}
                className="px-5 py-3.5 cursor-pointer hover:text-white transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  Ticket ID
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('title')}
                className="px-5 py-3.5 cursor-pointer hover:text-white transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  Title & Category
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('priority')}
                className="px-5 py-3.5 cursor-pointer hover:text-white transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  Priority
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="px-5 py-3.5 cursor-pointer hover:text-white transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  Status
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('sla_deadline')}
                className="px-5 py-3.5 cursor-pointer hover:text-white transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  SLA Target
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              {showAssignee && <th className="px-5 py-3.5">Assignee</th>}
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/60">
            {loading ? (
              <tr>
                <td colSpan={showAssignee ? 7 : 6} className="px-5 py-12 text-center text-dark-muted">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-primary/20 border-b-brand-primary"></div>
                  <p className="mt-3 text-xs font-medium">Querying incident records...</p>
                </td>
              </tr>
            ) : paginatedTickets.length === 0 ? (
              <tr>
                <td colSpan={showAssignee ? 7 : 6} className="px-5 py-16 text-center text-dark-muted">
                  <AlertCircle className="w-10 h-10 mx-auto text-slate-600 mb-2.5 opacity-60" />
                  <p className="font-semibold text-slate-300 text-sm">{emptyMessage}</p>
                  <p className="text-xs text-slate-500 mt-1">Try resetting filters or expanding search keywords.</p>
                </td>
              </tr>
            ) : (
              paginatedTickets.map((t) => {
                const role = user?.role === 'admin' ? 'admin' : user?.role === 'engineer' ? 'engineer' : 'user';
                const incidentLink = `/${role}/incidents/${t.id}`;

                return (
                  <tr key={t.id} className="hover:bg-dark-surface/50 transition-colors">
                    {/* Ticket ID */}
                    <td className="px-5 py-4 font-mono font-bold text-xs text-brand-accent">
                      <Link to={incidentLink} className="hover:underline">
                        {t.ticket_number}
                      </Link>
                    </td>

                    {/* Title & Category */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white max-w-xs md:max-w-md truncate">
                        <Link to={incidentLink} className="hover:text-brand-accent transition">
                          {t.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span className="font-mono text-[11px] text-slate-400">{t.category}</span>
                        <span>•</span>
                        <span className="text-[11px]">By {t.creator_name || 'User'}</span>
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td className="px-5 py-4">
                      <PriorityBadge priority={t.priority} />
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      <StatusBadge status={t.status} />
                    </td>

                    {/* SLA Timer */}
                    <td className="px-5 py-4">
                      <SlaTimer
                        slaDeadline={t.sla_deadline}
                        status={t.status}
                        isOverdue={t.is_overdue}
                      />
                    </td>

                    {/* Assignee */}
                    {showAssignee && (
                      <td className="px-5 py-4 text-xs">
                        {t.assignee_name ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {t.assignee_name}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Unassigned</span>
                        )}
                      </td>
                    )}

                    {/* View Action */}
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={incidentLink}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:text-white bg-brand-primary/10 hover:bg-brand-primary/20 px-3 py-1.5 rounded-lg border border-brand-primary/30 transition"
                      >
                        View
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="px-5 py-3.5 bg-dark-card border-t border-dark-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-dark-muted">
          <div className="flex items-center gap-2">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} incidents
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-navy-900 border border-dark-border rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-dark-border hover:bg-dark-surface text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-mono font-semibold text-slate-300">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-dark-border hover:bg-dark-surface text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTable;
