import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/shared/lib/localize', () => ({
  localizeMove: vi.fn((m: unknown) => m),
  localizeTag: vi.fn((t: unknown) => t),
}));

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    userProgress: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    userFavourite: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('@/shared/lib/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/shared/lib/prisma';
import bcrypt from 'bcryptjs';
import { cloudinary } from '@/shared/lib/cloudinary';

const mockRevalidatePath = revalidatePath as ReturnType<typeof vi.fn>;

import {
  getUserProgressAction,
  updateProgressAction,
  removeProgressAction,
  updateProfileAction,
  changePasswordAction,
  uploadAvatarAction,
  removeAvatarAction,
  addFavouriteAction,
  removeFavouriteAction,
  getUserFavouritesAction,
  getProfileUserAction,
  getProfileSettingsAction,
  getProfileStatsAction,
  getProfileOverviewAction,
} from './actions';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.userProgress.findMany as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.userProgress.upsert as ReturnType<typeof vi.fn>;
const mockProgressDeleteMany = prisma.userProgress.deleteMany as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockUserUpdate = prisma.user.update as ReturnType<typeof vi.fn>;
const mockFavouriteUpsert = prisma.userFavourite.upsert as ReturnType<typeof vi.fn>;
const mockFavouriteDeleteMany = prisma.userFavourite.deleteMany as ReturnType<typeof vi.fn>;
const mockFavouriteFindMany = prisma.userFavourite.findMany as ReturnType<typeof vi.fn>;
const mockProgressCount = prisma.userProgress.count as ReturnType<typeof vi.fn>;
const mockProgressGroupBy = prisma.userProgress.groupBy as ReturnType<typeof vi.fn>;
const mockFavouriteCount = prisma.userFavourite.count as ReturnType<typeof vi.fn>;
const mockBcryptCompare = bcrypt.compare as ReturnType<typeof vi.fn>;
const mockBcryptHash = bcrypt.hash as ReturnType<typeof vi.fn>;
const mockUploadStream = cloudinary.uploader.upload_stream as ReturnType<typeof vi.fn>;

const session = { user: { id: 'user-123' } };

beforeEach(() => vi.clearAllMocks());

describe('getUserProgressAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getUserProgressAction()).rejects.toThrow('Unauthorized');
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('returns progress for the authenticated user', async () => {
    mockAuth.mockResolvedValue(session);
    mockFindMany.mockResolvedValue([{ id: 'progress-1' }]);
    const result = await getUserProgressAction();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-123' } }),
    );
    expect(result).toEqual([{ id: 'progress-1' }]);
  });

  it('filters by status when status param is provided', async () => {
    mockAuth.mockResolvedValue(session);
    mockFindMany.mockResolvedValue([{ id: 'progress-2' }]);
    await getUserProgressAction('IN_PROGRESS');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-123', status: 'IN_PROGRESS' } }),
    );
  });
});

describe('updateProgressAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(updateProgressAction('move-1', 'IN_PROGRESS')).rejects.toThrow('Unauthorized');
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('upserts progress using session userId', async () => {
    mockAuth.mockResolvedValue(session);
    mockUpsert.mockResolvedValue({ id: 'progress-1' });
    const result = await updateProgressAction('move-1', 'IN_PROGRESS');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_moveId: { userId: 'user-123', moveId: 'move-1' } },
        create: expect.objectContaining({
          userId: 'user-123',
          moveId: 'move-1',
          status: 'IN_PROGRESS',
        }),
      }),
    );
    expect(result).toEqual({ id: 'progress-1' });
  });

  it('revalidates /profile, /profile/progress, and /moves/[id]', async () => {
    mockAuth.mockResolvedValue(session);
    mockUpsert.mockResolvedValue({ id: 'progress-1' });
    await updateProgressAction('move-1', 'IN_PROGRESS');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/profile');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/moves/move-1');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/profile/progress');
  });
});

describe('removeProgressAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(removeProgressAction('move-1')).rejects.toThrow('Unauthorized');
    expect(mockProgressDeleteMany).not.toHaveBeenCalled();
  });

  it('deletes progress record for the authenticated user', async () => {
    mockAuth.mockResolvedValue(session);
    await removeProgressAction('move-1');
    expect(mockProgressDeleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-123', moveId: 'move-1' },
    });
  });

  it('revalidates /profile, /profile/progress, and /moves/[id]', async () => {
    mockAuth.mockResolvedValue(session);
    await removeProgressAction('move-1');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/profile');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/moves/move-1');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/profile/progress');
  });
});

describe('updateProfileAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(updateProfileAction({ firstName: 'Alice', lastName: 'Pole' })).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('returns error for invalid input (empty firstName)', async () => {
    mockAuth.mockResolvedValue(session);
    const result = await updateProfileAction({ firstName: '', lastName: 'Pole' });
    expect(result).toEqual({ success: false, error: 'Invalid input' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('updates firstName and lastName', async () => {
    mockAuth.mockResolvedValue(session);
    mockUserUpdate.mockResolvedValue({ id: 'user-123' });
    const result = await updateProfileAction({ firstName: 'Alice', lastName: 'Pole' });
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { firstName: 'Alice', lastName: 'Pole' },
    });
    expect(result).toEqual({ success: true });
  });
});

describe('uploadAvatarAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(uploadAvatarAction(new FormData())).rejects.toThrow('Unauthorized');
  });

  it('returns error when no file provided', async () => {
    mockAuth.mockResolvedValue(session);
    const result = await uploadAvatarAction(new FormData());
    expect(result).toEqual({ success: false, error: 'No file provided' });
  });

  it('returns error for non-image file type', async () => {
    mockAuth.mockResolvedValue(session);
    const formData = new FormData();
    formData.append('avatar', new File(['data'], 'doc.pdf', { type: 'application/pdf' }));
    const result = await uploadAvatarAction(formData);
    expect(result).toEqual({ success: false, error: 'Only image files are allowed' });
  });

  it('returns error when file exceeds 5MB', async () => {
    mockAuth.mockResolvedValue(session);
    const formData = new FormData();
    formData.append(
      'avatar',
      new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' }),
    );
    const result = await uploadAvatarAction(formData);
    expect(result).toEqual({ success: false, error: 'File size must be under 5MB' });
  });

  it('uploads file and updates user image', async () => {
    mockAuth.mockResolvedValue(session);
    mockUploadStream.mockImplementation(
      (_opts: unknown, cb: (err: null, res: { secure_url: string }) => void) => {
        cb(null, { secure_url: 'https://res.cloudinary.com/test/image/upload/user-user-123' });
        return { end: vi.fn() };
      },
    );
    mockUserUpdate.mockResolvedValue({ id: 'user-123' });
    const formData = new FormData();
    formData.append('avatar', new File(['data'], 'photo.jpg', { type: 'image/jpeg' }));
    const result = await uploadAvatarAction(formData);
    expect(result).toEqual({
      success: true,
      imageUrl: 'https://res.cloudinary.com/test/image/upload/user-user-123',
    });
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { image: 'https://res.cloudinary.com/test/image/upload/user-user-123' },
    });
  });
});

describe('removeAvatarAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(removeAvatarAction()).rejects.toThrow('Unauthorized');
  });

  it('sets image to null and revalidates paths', async () => {
    mockAuth.mockResolvedValue(session);
    mockUserUpdate.mockResolvedValue({});
    const result = await removeAvatarAction();
    expect(result).toEqual({ success: true });
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { image: null },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});

describe('changePasswordAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(
      changePasswordAction({ currentPassword: 'old', newPassword: 'newpassword123' }),
    ).rejects.toThrow('Unauthorized');
  });

  it('returns error when user has no password (OAuth account)', async () => {
    mockAuth.mockResolvedValue(session);
    mockUserFindUnique.mockResolvedValue({ password: null });
    const result = await changePasswordAction({
      currentPassword: 'old',
      newPassword: 'Newpassword123!',
    });
    expect(result).toEqual({ success: false, error: 'Password change is not available' });
    expect(mockBcryptCompare).not.toHaveBeenCalled();
  });

  it('returns Invalid input when new password does not meet complexity rules', async () => {
    mockAuth.mockResolvedValue(session);
    const result = await changePasswordAction({
      currentPassword: 'anything',
      newPassword: 'alllowercase1!',
    });
    expect(result).toEqual({ success: false, error: 'Invalid input' });
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it('returns error when current password is incorrect', async () => {
    mockAuth.mockResolvedValue(session);
    mockUserFindUnique.mockResolvedValue({ password: 'hashed' });
    mockBcryptCompare.mockResolvedValue(false);
    const result = await changePasswordAction({
      currentPassword: 'wrong',
      newPassword: 'Newpassword123!',
    });
    expect(result).toEqual({ success: false, error: 'Current password is incorrect' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('updates password and returns success when current password is correct', async () => {
    mockAuth.mockResolvedValue(session);
    mockUserFindUnique.mockResolvedValue({ password: 'hashed' });
    mockBcryptCompare.mockResolvedValue(true);
    mockBcryptHash.mockResolvedValue('newhashed');
    mockUserUpdate.mockResolvedValue({ id: 'user-123' });
    const result = await changePasswordAction({
      currentPassword: 'correct',
      newPassword: 'Newpassword123!',
    });
    expect(mockBcryptHash).toHaveBeenCalledWith('Newpassword123!', 10);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { password: 'newhashed' },
    });
    expect(result).toEqual({ success: true });
  });
});

describe('addFavouriteAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(addFavouriteAction('move-1')).rejects.toThrow('Unauthorized');
  });

  it('upserts favourite and returns success (idempotent)', async () => {
    mockAuth.mockResolvedValue(session);
    mockFavouriteUpsert.mockResolvedValue({ id: 'fav-1' });
    const result = await addFavouriteAction('move-1');
    expect(mockFavouriteUpsert).toHaveBeenCalledWith({
      where: { userId_moveId: { userId: 'user-123', moveId: 'move-1' } },
      create: { userId: 'user-123', moveId: 'move-1' },
      update: {},
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/profile/favourite-moves');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/profile');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/moves/move-1');
    expect(result).toEqual({ success: true });
  });
});

describe('removeFavouriteAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(removeFavouriteAction('move-1')).rejects.toThrow('Unauthorized');
  });

  it('deletes favourite and returns success', async () => {
    mockAuth.mockResolvedValue(session);
    mockFavouriteDeleteMany.mockResolvedValue({ count: 1 });
    const result = await removeFavouriteAction('move-1');
    expect(mockFavouriteDeleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-123', moveId: 'move-1' },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/profile/favourite-moves');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/profile');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/moves/move-1');
    expect(result).toEqual({ success: true });
  });
});

describe('getUserFavouritesAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getUserFavouritesAction()).rejects.toThrow('Unauthorized');
  });

  it('returns favourites with move for the authenticated user', async () => {
    mockAuth.mockResolvedValue(session);
    mockFavouriteFindMany.mockResolvedValue([{ id: 'fav-1', move: { title: 'Spin', tags: [] } }]);
    const result = await getUserFavouritesAction();
    expect(mockFavouriteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123' },
        include: { move: { include: { tags: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(result).toEqual([{ id: 'fav-1', move: { title: 'Spin', tags: [] } }]);
  });
});

describe('getProfileStatsAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getProfileStatsAction()).rejects.toThrow('Unauthorized');
    expect(mockProgressCount).not.toHaveBeenCalled();
    expect(mockFavouriteCount).not.toHaveBeenCalled();
  });

  it('returns mastered count and favourites count', async () => {
    mockAuth.mockResolvedValue(session);
    mockProgressCount.mockResolvedValue(7);
    mockFavouriteCount.mockResolvedValue(3);
    const result = await getProfileStatsAction();
    expect(mockProgressCount).toHaveBeenCalledWith({
      where: { userId: 'user-123', status: 'LEARNED' },
    });
    expect(mockFavouriteCount).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    });
    expect(result).toEqual({ masteredCount: 7, favouritesCount: 3 });
  });
});

describe('getProfileUserAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getProfileUserAction()).rejects.toThrow('Unauthorized');
  });

  it('returns null when user is not found', async () => {
    mockAuth.mockResolvedValue(session);
    mockUserFindUnique.mockResolvedValue(null);
    const result = await getProfileUserAction();
    expect(result).toBeNull();
  });

  it('returns user profile fields', async () => {
    mockAuth.mockResolvedValue(session);
    mockUserFindUnique.mockResolvedValue({
      firstName: 'Alice',
      lastName: 'Pole',
      username: 'alice_pole',
      image: null,
      location: 'Warsaw',
      createdAt: new Date('2024-01-01'),
    });
    const result = await getProfileUserAction();
    expect(result?.firstName).toBe('Alice');
  });
});

describe('getProfileSettingsAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getProfileSettingsAction()).rejects.toThrow('Unauthorized');
  });

  it('returns null when user is not found', async () => {
    mockAuth.mockResolvedValue(session);
    mockUserFindUnique.mockResolvedValue(null);
    const result = await getProfileSettingsAction();
    expect(result).toBeNull();
  });

  it('returns hasPassword: true and strips password hash when user has a password', async () => {
    mockAuth.mockResolvedValue(session);
    mockUserFindUnique.mockResolvedValue({
      firstName: 'Alice',
      lastName: 'Pole',
      image: null,
      location: 'Warsaw, Poland',
      password: 'hashed_pw',
    });
    const result = await getProfileSettingsAction();
    expect(result).toEqual({
      firstName: 'Alice',
      lastName: 'Pole',
      image: null,
      location: 'Warsaw, Poland',
      hasPassword: true,
    });
    expect(result).not.toHaveProperty('password');
  });

  it('returns hasPassword: false for OAuth accounts (no password)', async () => {
    mockAuth.mockResolvedValue(session);
    mockUserFindUnique.mockResolvedValue({
      firstName: 'Bob',
      lastName: 'OAuth',
      image: 'https://example.com/photo.jpg',
      location: null,
      password: null,
    });
    const result = await getProfileSettingsAction();
    expect(result).toEqual({
      firstName: 'Bob',
      lastName: 'OAuth',
      image: 'https://example.com/photo.jpg',
      location: null,
      hasPassword: false,
    });
    expect(result).not.toHaveProperty('password');
  });
});

describe('getProfileOverviewAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getProfileOverviewAction()).rejects.toThrow('Unauthorized');
  });

  it('returns aggregated overview data for authenticated user', async () => {
    mockAuth.mockResolvedValue(session);
    mockProgressGroupBy.mockResolvedValue([
      { status: 'LEARNED', _count: 5 },
      { status: 'IN_PROGRESS', _count: 3 },
      { status: 'WANT_TO_LEARN', _count: 2 },
    ]);
    mockFindMany.mockResolvedValue([{ id: 'p1', move: { title: 'Spin', tags: [] } }]);
    mockFavouriteFindMany.mockResolvedValue([{ id: 'f1', move: { title: 'Butterfly', tags: [] } }]);
    mockFavouriteCount.mockResolvedValue(12);
    mockUserFindUnique.mockResolvedValue({
      firstName: 'Alice',
      lastName: 'Pole',
      username: 'alice',
      image: null,
      location: 'Warsaw',
      createdAt: new Date('2024-01-01'),
    });

    const result = await getProfileOverviewAction();

    expect(result.stats).toEqual({ masteredCount: 5, inProgressCount: 3, favouritesCount: 12 });
    expect(result.breakdown).toEqual({ learned: 5, inProgress: 3, wantToLearn: 2 });
    expect(result.currentlyLearning).toHaveLength(1);
    expect(result.favouritesPreview).toHaveLength(1);
    expect(result.user?.firstName).toBe('Alice');
  });

  it('handles missing progress groups gracefully', async () => {
    mockAuth.mockResolvedValue(session);
    mockProgressGroupBy.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([]);
    mockFavouriteFindMany.mockResolvedValue([]);
    mockFavouriteCount.mockResolvedValue(0);
    mockUserFindUnique.mockResolvedValue(null);

    const result = await getProfileOverviewAction();

    expect(result.stats).toEqual({ masteredCount: 0, inProgressCount: 0, favouritesCount: 0 });
    expect(result.breakdown).toEqual({ learned: 0, inProgress: 0, wantToLearn: 0 });
  });
});
