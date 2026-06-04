import React from 'react';

const EmptyState = ({ icon: Icon, title, description, className = "py-12" }) => {
  return (
    <div className={`flex flex-col items-center justify-center text-slate-400 ${className}`}>
      {Icon && <Icon className="w-12 h-12 mb-3 text-slate-300" />}
      <p className="font-medium text-slate-500">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
};

export default EmptyState;
