import { NotFoundState } from '@/components/layout/not-found-state';

export default function NotFound() {
  return (
    <NotFoundState
      fullScreen
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
    />
  );
}
