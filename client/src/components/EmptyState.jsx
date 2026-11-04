import React from 'react';
import MaterialIcon from './MaterialIcon';

/**
 * Clean Materialistic Empty State Component
 * Properly handles both Lucide forwardRef icon components, function components, and JSX nodes.
 */
export default function EmptyState({ icon: Icon, title, description, action, onAction }) {
  const renderIcon = () => {
    if (!Icon) {
      return <MaterialIcon name="sports_soccer" size={22} className="text-[#94A3B8]" />;
    }
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null)) {
      const IconComponent = Icon;
      return <IconComponent className="w-5 h-5" aria-hidden="true" />;
    }
    return null;
  };

  return (
    <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-10 h-10 rounded-[2px] bg-[#232832] border border-[#2A2E35] flex items-center justify-center mb-2.5 text-[#94A3B8]">
        {renderIcon()}
      </div>

      {title && (
        <h3 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA] mb-1">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-[11px] text-[#94A3B8] max-w-sm mb-3">
          {description}
        </p>
      )}

      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-3.5 py-1.5 rounded-[2px] bg-[#FFC107] hover:bg-[#E5AC00] text-[#111418] text-[12px] font-bold uppercase tracking-wider transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}
