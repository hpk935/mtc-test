import { NotFoundState } from '@/components/layout/not-found-state';

export default function UserNotFound() {
  return (
    <NotFoundState
      title="User not found"
      description="This user doesn't exist or the link is incorrect."
      backHref="/users"
      backLabel="Back to Users"
    />
  );
}
