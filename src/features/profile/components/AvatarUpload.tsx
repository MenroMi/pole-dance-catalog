'use client';
import Image from 'next/image';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
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
    setIsPending(true);
    setError(null);
    try {
      await removeAvatarAction();
      setPreview(null);
      onUploadSuccess();
    } catch {
      setError(t('avatarUploadFailed'));
    } finally {
      setIsPending(false);
    }
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setIsPending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const result = await uploadAvatarAction(formData);
      if (!result.success) {
        setError(result.error ?? t('avatarUploadFailed'));
      } else {
        onUploadSuccess();
        setPreview(null);
      }
    } catch {
      setError(t('avatarUploadFailed'));
    } finally {
      setIsPending(false);
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
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          {t('choosePhoto')}
        </Button>
        {preview && (
          <Button type="button" size="sm" onClick={handleUpload} disabled={isPending}>
            {isPending ? t('uploadingPhoto') : t('uploadPhoto')}
          </Button>
        )}
        {currentImage && !preview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
          >
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
