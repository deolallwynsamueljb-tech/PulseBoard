export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-surface-700 rounded-lg ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-xl p-5 space-y-3">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton({ height = "h-64" }) {
  return (
    <div className={`bg-surface-800 border border-surface-600 rounded-xl p-6 ${height}`}>
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="flex items-end gap-3 h-40 px-2">
        {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ rows = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-surface-600">
          {[1, 2, 3, 4].map((j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
