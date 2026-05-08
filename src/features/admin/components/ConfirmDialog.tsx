'use client';

import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  danger?: boolean;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  loadingLabel = '…',
  onConfirm,
  onCancel,
  loading,
  error,
  danger,
  children,
}: ConfirmDialogProps) {
  const t = useTranslations('admin');
  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <AlertDialogContent
        style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#e0e0e0',
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: '#e0e0e0' }}>{title}</AlertDialogTitle>
          <AlertDialogDescription style={{ color: '#888' }}>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {error && <p style={{ color: '#f87171', fontSize: 13, margin: '4px 0 0' }}>{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e0e0e0',
            }}
          >
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: danger ? '#dc2626' : '#8458b3',
              color: '#fff',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? loadingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
