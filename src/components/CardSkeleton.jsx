import React from 'react';

const CardSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm animate-pulse"
        >
          <div className="flex justify-between gap-4">
            <div className="flex-1">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-200 rounded"></div>
              <div className="h-8 w-24 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default CardSkeleton;
