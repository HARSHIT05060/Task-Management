import { format } from 'date-fns';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { LayoutList, SearchX } from 'lucide-react';

const STATUSES = ['Not Started', 'In Progress', 'On Hold', 'In Review', 'Completed', 'Cancelled'];

export default function ListView({ tasks, members, onTaskSelect, onTaskUpdate }) {
  if (tasks.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-10 text-center text-text-tertiary">
      <SearchX size={48} className="opacity-20 mb-4" />
      <div className="text-lg font-semibold text-text-secondary">No Tasks Found</div>
      <div className="text-sm max-w-sm mt-1">Try adjusting your filters or create a new task to get started.</div>
    </div>
  );

  return (
    <div className="p-6 h-full overflow-y-auto w-full custom-scrollbar pb-24">
      <div className="bg-bg-surface border border-border-default rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-surface2/80 border-b border-border-default text-xs tracking-wider font-semibold text-text-tertiary uppercase">
              <th className="px-5 py-3.5 w-[50%]">Task Title</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Priority</th>
              <th className="px-5 py-3.5">Assignee</th>
              <th className="px-5 py-3.5">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {tasks.map(task => (
              <tr 
                key={task._id} 
                className="hover:bg-bg-surface2/40 transition-colors group cursor-pointer"
                onClick={() => onTaskSelect(task)}
              >
                <td className="px-5 py-3">
                  <div className="font-semibold text-text-primary text-sm group-hover:text-accent transition-colors">
                    {task.title}
                  </div>
                  <div className="text-xs text-text-tertiary font-mono uppercase tracking-widest mt-0.5">
                    #{task._id.slice(-6)}
                  </div>
                </td>
                <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                  <select 
                    className="select py-1 text-xs border-transparent group-hover:border-border-default bg-transparent group-hover:bg-bg-surface hover:!bg-bg-surface w-auto shadow-none group-hover:shadow-sm transition-all focus:ring-1 focus:ring-accent"
                    value={task.status}
                    onChange={(e) => onTaskUpdate({ ...task, status: e.target.value })}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-5 py-3">
                  {task.assignee_id ? (
                    <div className="flex items-center gap-2">
                       <Avatar name={task.assignee_id.name} color={task.assignee_id.avatar_color} size="sm" />
                       <span className="text-xs font-medium text-text-secondary">{task.assignee_id.name.split(' ')[0]}</span>
                    </div>
                  ) : <span className="text-xs text-text-tertiary italic">Unassigned</span>}
                </td>
                <td className="px-5 py-3 text-sm text-text-secondary whitespace-nowrap">
                  {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
