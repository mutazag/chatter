interface SkeletonItemProps {
  hasAvatar?: boolean;
}

export function SkeletonItem({ hasAvatar = false }: SkeletonItemProps) {
  return (
    <div className="skeleton-item">
      {hasAvatar && <div className="skeleton skeleton-avatar" />}
      <div className="skeleton skeleton-text" />
    </div>
  );
}

export function SidebarSkeleton({ count = 4, hasAvatar = false }: { count?: number; hasAvatar?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} hasAvatar={hasAvatar} />
      ))}
    </>
  );
}
