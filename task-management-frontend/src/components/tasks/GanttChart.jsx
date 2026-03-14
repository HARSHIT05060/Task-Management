import { startOfMonth, endOfMonth, eachDayOfInterval, format, differenceInDays } from 'date-fns';
import { PriorityBadge } from '../ui/Badge';
import Avatar from '../ui/Avatar';

export default function GanttChart({ tasks, onTaskSelect }) {
  const withDates = tasks.filter(t => t.start_date || t.due_date);
  
  if (withDates.length === 0) return (
    <div className="flex items-center justify-center h-full text-text-tertiary bg-bg-surface/50 m-4 rounded-xl border border-dashed border-border-default">
      No tasks with dates assigned to generate timeline.
    </div>
  );

  const minD = new Date(Math.min(...withDates.map(t => new Date(t.start_date || t.due_date))));
  const maxD = new Date(Math.max(...withDates.map(t => new Date(t.due_date || t.start_date))));
  const start = startOfMonth(minD);
  const end = endOfMonth(maxD);
  const days = eachDayOfInterval({ start, end });

  const getLeft = (date) => (differenceInDays(new Date(date), start) / days.length) * 100;
  const getWidth = (s, e) => (Math.max(1, differenceInDays(new Date(e), new Date(s))) / days.length) * 100;

  return (
    <div className="p-6 h-full overflow-hidden flex flex-col w-full pb-24">
      <div className="bg-bg-surface border border-border-default rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Header timeline */}
        <div className="flex border-b border-border-default bg-bg-surface2/50 shrink-0 select-none">
          <div className="w-64 shrink-0 border-r border-border-default p-3 text-xs font-bold text-text-tertiary uppercase tracking-wider relative flex items-end">
             Timeline / Tasks
          </div>
          <div className="flex-1 relative h-12 flex overflow-hidden">
             {days.map((d, i) => (
                <div key={i} className="flex-1 border-r border-border-default/50 text-[10px] text-text-tertiary p-1 shrink-0 min-w-[30px] flex flex-col items-center justify-end">
                   <span>{format(d, 'd')}</span>
                </div>
             ))}
          </div>
        </div>
        
        {/* Task Rows */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
           {withDates.map(task => {
              const sDate = task.start_date || task.due_date;
              const eDate = task.due_date || task.start_date;
              const left = getLeft(sDate);
              const width = getWidth(sDate, eDate);
              
              const pColors = {
                 low: 'bg-bg-surface3/80 border-border-strong text-text-secondary',
                 medium: 'bg-accent/80 border-accent text-accent-text',
                 high: 'bg-amber/80 border-amber text-amber-text',
                 critical: 'bg-red/80 border-red text-red-text'
              };

              return (
                 <div key={task._id} className="flex border-b border-border-default/50 hover:bg-bg-surface2/30 transition-colors group cursor-pointer" onClick={() => onTaskSelect(task)}>
                    <div className="w-64 shrink-0 border-r border-border-default p-3 flex flex-col justify-center bg-bg-surface">
                       <div className="text-sm font-semibold text-text-primary truncate">{task.title}</div>
                       <div className="flex items-center gap-2 mt-1">
                          <PriorityBadge priority={task.priority} />
                          <div className="text-[10px] text-text-tertiary font-mono truncate">{task.assignee_id?.name || 'Unassigned'}</div>
                       </div>
                    </div>
                    <div className="flex-1 relative py-2.5 group-hover:bg-bg-surface3/10 transition-colors pointer-events-none">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex pointer-events-none opacity-20">
                           {days.map((_, i) => <div key={i} className="flex-1 border-r border-border-default min-w-[30px]" />)}
                        </div>
                       {/* Task Bar */}
                       <div className={`absolute h-8 rounded-md border shadow-sm flex items-center px-3 truncate text-xs font-medium cursor-pointer transition-transform group-hover:scale-[1.01] pointer-events-auto backdrop-blur-sm ${pColors[task.priority] || pColors.medium}`}
                            style={{ left: `${left}%`, width: `calc(${width}% + 30px)` }}>
                           {task.title}
                       </div>
                    </div>
                 </div>
              );
           })}
        </div>
      </div>
    </div>
  );
}
