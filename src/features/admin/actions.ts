'use server';
import { Difficulty, Category } from '@prisma/client';
import { z } from 'zod';

import { auth } from '@/shared/lib/auth';
import { prisma } from '@/shared/lib/prisma';

import type { CreateMoveInput } from './types';

const createMoveSchema = z.object({
  title_pl: z.string().min(1),
  title_en: z.string().min(1),
  description_pl: z.string().optional(),
  description_en: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty),
  category: z.nativeEnum(Category),
  youtubeUrl: z.string().url(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function createMoveAction(input: CreateMoveInput) {
  await requireAdmin();
  const parsed = createMoveSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');
  return prisma.move.create({
    data: {
      title_pl: parsed.data.title_pl,
      title_en: parsed.data.title_en,
      description_pl: parsed.data.description_pl,
      description_en: parsed.data.description_en,
      difficulty: parsed.data.difficulty,
      category: parsed.data.category,
      youtubeUrl: parsed.data.youtubeUrl,
      imageUrl: parsed.data.imageUrl,
      tags: {
        connectOrCreate: (parsed.data.tags ?? []).map((name) => ({
          where: { name_en: name },
          create: { name_pl: name, name_en: name },
        })),
      },
    },
  });
}

export async function deleteMoveAction(id: string) {
  await requireAdmin();
  return prisma.move.delete({ where: { id } });
}
