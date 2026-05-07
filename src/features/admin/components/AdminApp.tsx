'use client';

import { useState } from 'react';

import { AdminDashboard } from './AdminDashboard';
import { AdminMoves } from './AdminMoves';
import { AdminShell } from './AdminShell';
import { AdminTags } from './AdminTags';
import { AdminUsers } from './AdminUsers';

type Section = 'dashboard' | 'moves' | 'users' | 'tags';

const STORAGE_KEY = 'admin_section';

function getSavedSection(): Section {
  if (typeof window === 'undefined') return 'dashboard';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'moves' || saved === 'users' || saved === 'tags') return saved;
  return 'dashboard';
}

export function AdminApp({ currentUserId }: { currentUserId: string | null }) {
  const [section, setSection] = useState<Section>(getSavedSection);

  function handleSectionChange(s: Section) {
    setSection(s);
    localStorage.setItem(STORAGE_KEY, s);
  }

  return (
    <AdminShell activeSection={section} onSectionChange={handleSectionChange}>
      {section === 'dashboard' && <AdminDashboard />}
      {section === 'moves' && <AdminMoves />}
      {section === 'users' && <AdminUsers currentUserId={currentUserId} />}
      {section === 'tags' && <AdminTags />}
    </AdminShell>
  );
}
