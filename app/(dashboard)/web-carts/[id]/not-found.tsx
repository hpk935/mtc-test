import { NotFoundState } from '@/components/layout/not-found-state';

export default function WebCartNotFound() {
  return (
    <NotFoundState
      title="Web cart not found"
      description="This cart doesn't exist on the online store."
      backHref="/web-carts"
      backLabel="Back to Web Carts"
    />
  );
}
