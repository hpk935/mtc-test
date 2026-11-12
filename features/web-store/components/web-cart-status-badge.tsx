import { Badge } from '@/components/ui/badge';
import { WEB_CART_STATUS_LABEL, type WebCartStatus } from '../cart-status';

const VARIANT: Record<WebCartStatus, 'success' | 'warning' | 'info'> = {
  active: 'success',
  expired: 'warning',
  completed: 'info',
};

export function WebCartStatusBadge({ status }: { status: WebCartStatus }) {
  return (
    <Badge variant={VARIANT[status]}>{WEB_CART_STATUS_LABEL[status]}</Badge>
  );
}
