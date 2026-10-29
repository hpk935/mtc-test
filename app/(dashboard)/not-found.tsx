import { NotFoundState } from '@/components/layout/not-found-state';

export default function DashboardNotFound() {
  return (
    <NotFoundState
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
    />
  );
}
