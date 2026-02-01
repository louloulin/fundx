/**
 * Skeleton Loader Component
 *
 * Displays loading placeholders while data is being fetched
 */

'use client';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card' | 'row' | 'fund-card';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  style = {}
}: SkeletonProps) {
  const baseClass = `skeleton skeleton-${variant} ${className}`.trim();

  const renderSkeleton = (index: number) => {
    const computedStyle: React.CSSProperties = { ...style };
    if (width) computedStyle.width = typeof width === 'number' ? `${width}px` : width;
    if (height) computedStyle.height = typeof height === 'number' ? `${height}px` : height;

    return (
      <div
        key={index}
        className={baseClass}
        style={computedStyle}
      />
    );
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
    </>
  );
}

// 预设的骨架屏组件

export function FundCardSkeleton() {
  return (
    <div className="glass card fund-card-skeleton">
      <div style={{ marginBottom: 16 }}>
        <div className="skeleton-row" style={{ marginBottom: 12 }}>
          <Skeleton variant="circle" width={24} height={24} />
          <Skeleton variant="text" width={120} height={20} />
        </div>
        <div className="skeleton-row">
          <Skeleton variant="text" width={80} />
          <Skeleton variant="text" width={80} />
          <Skeleton variant="text" width={80} />
        </div>
      </div>
      <Skeleton variant="text" width="100%" height={40} />
    </div>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="stats-grid-skeleton">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="stat-card-skeleton">
          <Skeleton variant="text" width={60} height={14} />
          <Skeleton variant="text" width={80} height={28} style={{ marginTop: 8 }} />
          <Skeleton variant="text" width={40} height={12} style={{ marginTop: 4 }} />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-skeleton">
      {/* 表头 */}
      <div className="table-header-skeleton">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="text" width="100%" height={16} />
        ))}
      </div>
      {/* 表体 */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="table-row-skeleton">
          {[1, 2, 3, 4].map(j => (
            <Skeleton key={j} variant="text" width="100%" height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="chart-skeleton">
      <Skeleton variant="text" width={100} height={16} style={{ marginBottom: 16 }} />
      <Skeleton variant="rect" width="100%" height={200} />
    </div>
  );
}

export function RecommendationsSkeleton() {
  return (
    <div className="recommendations-skeleton">
      <div style={{ marginBottom: 24 }}>
        <Skeleton variant="text" width={120} height={18} style={{ marginBottom: 16 }} />
        <div className="skeleton-row" style={{ gap: 12 }}>
          <Skeleton variant="rect" width={80} height={36} />
          <Skeleton variant="rect" width={80} height={36} />
          <Skeleton variant="rect" width={80} height={36} />
        </div>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="recommendation-card-skeleton" style={{ marginBottom: 12 }}>
          <div className="skeleton-row" style={{ marginBottom: 12, justifyContent: 'space-between' }}>
            <Skeleton variant="text" width={150} height={18} />
            <Skeleton variant="text" width={40} height={24} />
          </div>
          <div className="skeleton-row" style={{ gap: 8 }}>
            <Skeleton variant="text" width={60} height={14} />
            <Skeleton variant="text" width={60} height={14} />
            <Skeleton variant="text" width={60} height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
