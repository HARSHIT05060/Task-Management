import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PriorityBadge } from '../ui/Badge';

export default function CalendarView({ tasks, onTaskSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach(task => {
      if (task.due_date) {
        const d = format(new Date(task.due_date), 'yyyy-MM-dd');
        if (!map[d]) map[d] = [];
        map[d].push(task);
      }
    });
    return map;
  }, [tasks]);

  return (
    <div className="h-full flex flex-col p-6 pb-24 max-w-7xl mx-auto">
      <div className="bg-bg-surface border border-border-default rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default bg-bg-surface2/50 shrink-0">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
             {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-ghost btn-sm font-medium" onClick={() => setCurrentDate(new Date())}>Today</button>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-border-default border-t border-border-default grid grid-cols-7 gap-[1px]">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-bg-surface2/80 p-2 text-center text-xs font-bold text-text-tertiary uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm border-b border-border-default shadow-sm">
              {day}
            </div>
          ))}

          {/* Days */}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDay[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div key={dateKey} className={`min-h-[120px] bg-bg-surface p-1.5 transition-colors hover:bg-bg-surface2/30 flex flex-col gap-1 ${!isCurrentMonth ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className={`text-xs font-semibold p-1 w-6 h-6 flex items-center justify-center rounded-full ml-auto ${isCurrentDay ? 'bg-accent text-white shadow-sm ring-2 ring-accent/30' : 'text-text-secondary'}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar pr-1 hide-scrollbar">
                  {dayTasks.map(task => (
                    <div key={task._id} onClick={() => onTaskSelect(task)}
                      className={`text-[10px] px-2 py-1 rounded truncate border border-border-default cursor-pointer font-medium shadow-sm transition-transform hover:scale-[1.02] ${
                        task.status === 'Completed' ? 'bg-bg-surface3/50 text-text-tertiary line-through' :
                        task.priority === 'critical' || task.priority === 'high' ? 'bg-red/10 border-red/20 text-red hover:bg-red/20' :
                        'bg-bg-surface2 text-text-primary hover:bg-bg-surface3/50'
                      }`}>
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
