import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { List, Columns3, CalendarDays, BarChart2, Plus, ArrowLeft, Filter, GitBranch } from 'lucide-react';
import ListView from '../components/tasks/ListView';
import KanbanBoard from '../components/tasks/KanbanBoard';
import CalendarView from '../components/tasks/CalendarView';
import GanttChart from '../components/tasks/GanttChart';
import WorkloadView from '../components/tasks/WorkloadView';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import Tooltip from '../components/ui/Tooltip';

// Keyboard friendly shortcut letters
const VIEWS = [
  { id: 'kanban',   label: 'Board',    Icon: Columns3,     hotkey: 'B' },
  { id: 'list',     label: 'List',     Icon: List,         hotkey: 'L' },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays, hotkey: 'C' },
  { id: 'gantt',    label: 'Gantt',    Icon: GitBranch,    hotkey: 'G' },
  { id: 'workload', label: 'Workload', Icon: BarChart2,    hotkey: 'W' },
];

const STATUSES = ['Not Started', 'In Progress', 'On Hold', 'In Review', 'Completed', 'Cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function TasksPage() {
  const { siteId } = useParams();
  const { org } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('kanban');
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', assignee_id: '' });
  const [showFilters, setShowFilters] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!org) return;
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.assignee_id) params.set('assignee_id', filters.assignee_id);
    const res = await api.get(`/orgs/${org._id}/sites/${siteId}/tasks?${params}&limit=200`);
    setTasks(res.data.tasks || []);
  }, [org, siteId, filters]);

  useEffect(() => {
    if (!org) return;
    setLoading(true);
    Promise.all([
      api.get(`/orgs/${org._id}/sites/${siteId}`),
      api.get(`/orgs/${org._id}/sites/${siteId}/members`),
    ]).then(([sRes, mRes]) => {
      setSite(sRes.data);
      setMembers(mRes.data);
    }).catch(() => {});
    loadTasks().finally(() => setLoading(false));
  }, [org, siteId]);

  useEffect(() => {
    loadTasks();
  }, [filters]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || selectedTask || showCreate) return;
      
      const key = e.key.toLowerCase();
      if (key === 'b') { e.preventDefault(); setView('kanban'); }
      if (key === 'l') { e.preventDefault(); setView('list'); }
      if (key === 'c') { e.preventDefault(); setView('calendar'); }
      if (key === 'g') { e.preventDefault(); setView('gantt'); }
      if (key === 'w') { e.preventDefault(); setView('workload'); }
      if (key === 'n') { e.preventDefault(); setShowCreate(true); }
      if (key === 'f') { e.preventDefault(); setShowFilters(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTask, showCreate]);

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? { ...t, ...updatedTask } : t));
    if (selectedTask?._id === updatedTask._id) setSelectedTask(prev => ({ ...prev, ...updatedTask }));
  };

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
    setShowCreate(false);
  };

  const handleTaskDelete = (taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
    setSelectedTask(null);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const viewProps = { tasks, members, siteId, orgId: org?._id, onTaskSelect: setSelectedTask, onTaskUpdate: handleTaskUpdate };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-4 py-4 px-6 shrink-0 border-b border-border-default bg-bg-primary">
        <button className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors" onClick={() => navigate(`/sites/${siteId}`)} title="Back to site detail">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">{site?.name || 'Tasks Workspace'}</h1>
          <p className="text-xs font-medium text-text-tertiary mt-0.5">{tasks.length} active tasks</p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Segmented view switcher */}
          <div className="hidden sm:flex items-center bg-bg-surface2 p-1 rounded-lg border border-border-default mr-4">
            {VIEWS.map(({ id, label, Icon, hotkey }) => (
              <Tooltip key={id} content={<>Switch to {label} <kbd className="ml-2 font-mono text-[10px] bg-white/20 px-1 rounded">{hotkey}</kbd></>} side="bottom">
                <button 
                  onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    view === id ? 'bg-bg-surface text-text-primary shadow-sm ring-1 ring-border-default' : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface3/50'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              </Tooltip>
            ))}
          </div>

          <Tooltip content={<>Toggle Filters <kbd className="ml-2 font-mono text-[10px] bg-white/20 px-1 rounded">F</kbd></>} side="bottom">
            <button className={`btn btn-sm transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20' : 'btn-secondary'}`} onClick={() => setShowFilters(v => !v)} style={{ position: 'relative' }}>
              <Filter size={14} />Filters
              {activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-accent text-white w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center border border-bg-surface">{activeFilterCount}</span>}
            </button>
          </Tooltip>
          
          <Tooltip content={<>New Task <kbd className="ml-2 font-mono text-[10px] bg-white/20 px-1 rounded">N</kbd></>} side="bottom">
            <button className="btn btn-primary btn-sm shadow-sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} />New Task
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Filter bar */}
      <div className={`overflow-hidden transition-all duration-200 shrink-0 bg-bg-surface border-b border-border-default px-6 ${showFilters ? 'py-3' : 'h-0 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mr-2">Filter by:</div>
          <select className="select py-1.5 text-sm w-auto" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">Status (Any)</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select py-1.5 text-sm w-auto" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">Priority (Any)</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
          <select className="select py-1.5 text-sm w-auto" value={filters.assignee_id} onChange={e => setFilters(f => ({ ...f, assignee_id: e.target.value }))}>
            <option value="">Assignee (Any)</option>
            {members.map(m => <option key={m.user_id?._id} value={m.user_id?._id}>{m.user_id?.name}</option>)}
          </select>
          {activeFilterCount > 0 && <button className="btn btn-ghost btn-sm text-text-tertiary ml-2" onClick={() => setFilters({ status: '', priority: '', assignee_id: '' })}>Clear all</button>}
        </div>
      </div>

      {/* View content area */}
      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center gap-3 flex-col bg-bg-primary/50 text-text-tertiary">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
            <span className="text-sm font-medium">Loading workspace...</span>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-auto bg-bg-surface/50 dark:bg-transparent">
             {view === 'kanban'   && <KanbanBoard {...viewProps} orgId={org?._id} />}
             {view === 'list'     && <ListView    {...viewProps} />}
             {view === 'calendar' && <CalendarView {...viewProps} />}
             {view === 'gantt'    && <GanttChart  {...viewProps} />}
             {view === 'workload' && <WorkloadView {...viewProps} />}
          </div>
        )}
      </div>

      {/* Drawers/Modals */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          siteId={siteId}
          orgId={org?._id}
          members={members}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {showCreate && (
        <CreateTaskModal
          siteId={siteId}
          orgId={org?._id}
          members={members}
          onClose={() => setShowCreate(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
