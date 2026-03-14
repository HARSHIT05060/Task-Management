import { useState, useCallback } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isAfter } from 'date-fns';
import { Clock } from 'lucide-react';
import { PriorityBadge } from '../ui/Badge';
import Avatar from '../ui/Avatar';
import api from '../../lib/api';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'Not Started',  color: '#64748b' },
  { id: 'In Progress',  color: '#3b82f6' },
  { id: 'On Hold',      color: '#f59e0b' },
  { id: 'In Review',    color: '#8b5cf6' },
  { id: 'Completed',    color: '#22c55e' },
];

const priorityColors = { low: 'var(--text-muted)', medium: 'var(--amber)', high: 'var(--orange)', critical: 'var(--red)' };

function KanbanCard({ task, onSelect, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSortDragging ? 0.4 : 1 };
  const overdue = task.due_date && isAfter(new Date(), new Date(task.due_date)) && !['Completed','Cancelled'].includes(task.status);
  const stripColor = priorityColors[task.priority] || priorityColors.low;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`kanban-card group pl-4 ${isSortDragging ? 'ring-2 ring-accent shadow-lg' : ''}`} onClick={() => onSelect(task)}>
      {/* Priority Strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-colors" style={{ backgroundColor: stripColor }} />

      <div className="text-sm font-semibold text-text-primary leading-tight mb-2 group-hover:text-accent transition-colors">{task.title}</div>
      
      <div className="flex gap-1.5 mb-3 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {task.tags?.slice(0,1).map(t => (
          <span key={t} className="bg-bg-surface3 text-text-secondary rounded text-[10px] font-medium px-1.5 py-0.5 uppercase tracking-wider">{t}</span>
        ))}
      </div>
      
      <div className="flex items-center justify-between border-t border-border-default pt-2.5 mt-auto">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${overdue ? 'text-red' : 'text-text-tertiary'}`}>
          <Clock size={12} />
          {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No due date'}
        </div>
        {task.assignee_id ? <Avatar name={task.assignee_id.name} color={task.assignee_id.avatar_color} size="sm" /> : 
          <div className="w-6 h-6 rounded-full border border-dashed border-border-strong flex items-center justify-center bg-bg-surface2 text-text-tertiary text-[10px]" title="Unassigned">?</div>
        }
      </div>
    </div>
  );
}

function ColumnHeader({ status, color, count }) {
  return (
    <div className="flex items-center justify-between p-3 mb-2 bg-bg-surface2/50 rounded-lg border border-border-default sticky top-0 z-10 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
        <span className="font-semibold text-text-primary text-sm tracking-tight">{status}</span>
      </div>
      <span className="bg-bg-surface border border-border-default text-text-secondary rounded-full px-2 py-0.5 text-xs font-bold shadow-sm">{count}</span>
    </div>
  );
}

export default function KanbanBoard({ tasks, onTaskSelect, onTaskUpdate, orgId, siteId }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const tasksByCol = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

  const handleDragStart = (e) => setActiveId(e.active.id);

  const handleDragEnd = useCallback(async (e) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const task = tasks.find(t => t._id === active.id);
    const newStatus = COLUMNS.find(c => c.id === over.id)?.id || tasks.find(t => t._id === over.id)?.status;

    if (!newStatus || task.status === newStatus) return;

    // Optimistic update
    onTaskUpdate({ ...task, status: newStatus });

    try {
      await api.put(`/orgs/${orgId}/sites/${siteId}/tasks/${task._id}`, { status: newStatus });
      toast.success(`Moved to "${newStatus}"`);
    } catch { 
      toast.error('Update failed, reverting...');
      onTaskUpdate(task); // revert
    }
  }, [tasks, orgId, siteId, onTaskUpdate]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full overflow-x-auto overflow-y-hidden p-4 gap-4 items-start select-none">
        {COLUMNS.map(({ id, color }) => (
          <div key={id} className="w-[300px] shrink-0 flex flex-col max-h-full">
            <ColumnHeader status={id} color={color} count={tasksByCol[id]?.length || 0} />
            <SortableContext items={tasksByCol[id]?.map(t => t._id) || []} strategy={verticalListSortingStrategy} id={id}>
              <div className="flex-1 overflow-y-auto p-1 mt-1 flex flex-col gap-3 min-h-[150px] scrollbar-thin rounded-lg transition-colors border-2 border-transparent">
                {tasksByCol[id]?.map(task => (
                  <KanbanCard key={task._id} task={task} onSelect={onTaskSelect} />
                ))}
                {tasksByCol[id]?.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-border-default rounded-xl flex items-center justify-center text-sm font-medium text-text-tertiary m-1 uppercase tracking-wider">
                    Drop tasks here
                  </div>
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="kanban-card pl-4 opacity-95 shadow-2xl scale-105 border-accent ring-2 ring-accent">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ backgroundColor: priorityColors[activeTask.priority] || priorityColors.low }} />
            <div className="text-sm font-semibold text-text-primary leading-tight mb-2">{activeTask.title}</div>
            <PriorityBadge priority={activeTask.priority} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
