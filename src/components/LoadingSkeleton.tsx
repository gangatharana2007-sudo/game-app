import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-slate-800 rounded" />
            <div className="h-4 w-16 bg-slate-800 rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-slate-800 rounded" />
          <div className="space-y-2 py-2">
            <div className="h-3 w-full bg-slate-800/60 rounded" />
            <div className="h-3 w-4/5 bg-slate-800/60 rounded" />
          </div>
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <div className="h-4 w-24 bg-slate-800 rounded" />
            <div className="h-8 w-24 bg-slate-800 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-950 border-b border-slate-800" />
      <div className="divide-y divide-slate-800/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 flex items-center px-4 justify-between">
            <div className="h-4 w-12 bg-slate-800 rounded" />
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-4 w-24 bg-slate-800 rounded" />
            <div className="h-4 w-16 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
