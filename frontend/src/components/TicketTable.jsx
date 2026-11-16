import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import SlaTimer from './SlaTimer';
import { Search, Filter, ExternalLink, AlertCircle } from 'lucide-react';

const TicketTable = ({
  tickets = [],
  loading = false,
  onFilterChange,
  showAssignee = true,
  emptyMessage = 'No tickets match the selected filters.',
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (onFilterChange) onFilterChange({ search: e.target.value, status: statusFilter, priority: priorityFilter });
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    if (onFilterChange) onFilterChange({ search: searchTerm, status: e.target.value, priority: priorityFilter });
  };

  const handlePriorityChange = (e) => {
    setPriorityFilter(e.target.value);
    if (onFilterChange) onFilterChange({ search: searchTerm, status: statusFilter, priority: e.target.value });
  };

  // Local filtering if server-side filtering is not attached
  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      !searchTerm ||
      t.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;

    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Search and Filters Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ID, title..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={handlePriorityChange}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Ticket ID</th>
              <th className="px-5 py-3.5">Title & Category</th>
              <th className="px-5 py-3.5">Priority</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">SLA Target</th>
              {showAssignee && <th className="px-5 py-3.5">Assignee</th>}
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={showAssignee ? 7 : 6} className="px-5 py-12 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                  <p className="mt-2 text-xs">Loading incident records...</p>
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={showAssignee ? 7 : 6} className="px-5 py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium text-slate-600">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => {
                const incidentLink = `/${user?.role || 'user'}/incidents/${t.id}`;
                return (
                <tr key={t.id} className="hover:bg-slate-50/75 transition">
                  <td className="px-5 py-4 font-mono font-semibold text-xs text-sky-700">
                    <Link to={incidentLink} className="hover:underline">
                      {t.ticket_number}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900 max-w-xs md:max-w-md truncate">
                      <Link to={incidentLink} className="hover:text-sky-600">
                        {t.title}
                      </Link>
                    </div>
                    <span className="text-xs text-slate-400 font-normal">{t.category}</span>
                  </td>
                  <td className="px-5 py-4">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-5 py-4">
                    <SlaTimer
                      slaDeadline={t.sla_deadline}
                      status={t.status}
                      isOverdue={t.is_overdue}
                    />
                  </td>
                  {showAssignee && (
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {t.assignee_name ? (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {t.assignee_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={incidentLink}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-2.5 py-1.5 rounded-md transition"
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
    </div>
  );
};

export default TicketTable;
