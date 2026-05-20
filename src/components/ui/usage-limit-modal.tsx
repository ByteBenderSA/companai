interface UsageLimitModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  limitType?: 'idea' | 'ai';
  currentUsage?: number;
  limit?: number;
  plan?: string;
}

export const UsageLimitModal = (_props: UsageLimitModalProps) => null;

export default UsageLimitModal;
