'use client';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/components/ui/button';

import { removeAvatarAction, uploadAvatarAction } from '../actions';

type AvatarUploadProps = {
  currentImage: string | null;
  onUploadSuccess: () => void;
};

export default function AvatarUpload({ currentImage, onUploadSuccess }: AvatarUploadProps) {
  const t = useTranslations('profile');
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'upload' | 'remove' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('avatarOnlyImages'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('avatarMaxSize'));
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
  }

  async function handleRemove() {
    setPendingAction('remove');
    setError(null);
    try {
      await removeAvatarAction();
      await update({ picture: null });
      setPreview(null);
      onUploadSuccess();
    } catch {
      setError(t('avatarUploadFailed'));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setPendingAction('upload');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const result = await uploadAvatarAction(formData);
      if (!result.success) {
        setError(result.error ?? t('avatarUploadFailed'));
      } else {
        await update({ picture: result.imageUrl });
        onUploadSuccess();
        setPreview(null);
      }
    } catch {
      setError(t('avatarUploadFailed'));
    } finally {
      setPendingAction(null);
    }
  }

  const displayImage = preview ?? currentImage;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-surface-high">
        {displayImage ? (
          <Image src={displayImage} alt={t('avatarAlt')} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-on-surface-variant">
            {t('noPhoto')}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-hidden="true"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pendingAction !== null}
          onClick={() => inputRef.current?.click()}
        >
          {t('choosePhoto')}
        </Button>
        {preview && (
          <Button type="button" size="sm" onClick={handleUpload} disabled={pendingAction !== null}>
            {pendingAction === 'upload' && <Loader2 className="h-4 w-4 animate-spin" />}
            {pendingAction === 'upload' ? t('uploadingPhoto') : t('uploadPhoto')}
          </Button>
        )}
        {currentImage && !preview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={pendingAction !== null}
          >
            {pendingAction === 'remove' && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('removePhoto')}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
