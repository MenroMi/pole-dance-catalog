'use client';

import { useState } from 'react';

import { SECTION_KEY } from '../constants';

import { AdminDashboard } from './AdminDashboard';
import { AdminMoves } from './AdminMoves';
import { AdminShell } from './AdminShell';
import { AdminTags } from './AdminTags';
import { AdminUsers } from './AdminUsers';

type Section = 'dashboard' | 'moves' | 'users' | 'tags';

function getSavedSection(): Section {
  if (typeof window === 'undefined') return 'dashboard';
  const saved = localStorage.getItem(SECTION_KEY);
  if (saved === 'moves' || saved === 'users' || saved === 'tags') return saved;
  return 'dashboard';
}

export function AdminApp({
  currentUserId,
  currentUserName,
}: {
  currentUserId: string | null;
  currentUserName?: string | null;
}) {
  const [section, setSection] = useState<Section>(getSavedSection);

  function handleSectionChange(s: Section) {
    setSection(s);
    localStorage.setItem(SECTION_KEY, s);
  }

  return (
    <AdminShell
      activeSection={section}
      onSectionChange={handleSectionChange}
      currentUserName={currentUserName}
    >
      {section === 'dashboard' && <AdminDashboard />}
      {section === 'moves' && <AdminMoves />}
      {section === 'users' && <AdminUsers currentUserId={currentUserId} />}
      {section === 'tags' && <AdminTags />}
    </AdminShell>
  );
}
