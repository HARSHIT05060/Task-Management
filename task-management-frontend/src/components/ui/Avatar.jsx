export default function Avatar({ name = '', color = '#4F6AF5', size = 'md', style = {}, className = '' }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';
  const sizeMap = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm'
  };
  return (
    <div 
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-bg-surface shadow-sm ${sizeMap[size]} ${className}`} 
      style={{
        background: `linear-gradient(135deg, ${color}dd, ${color})`,
        ...style 
      }} 
      title={name}
    >
      {initials}
    </div>
  );
}
