// components/Header.tsx
'use client';

import Link from 'next/link';

export default function Header({ session }: { session: any }) {
  return (
    <nav>
      {session ? (
        <>
          <Link href="/planes">Planes</Link>
          <Link href="/carta-de-presentacion">Carta</Link>
          <Link href="/arregla-mi-curriculum">Currículum</Link>
          <span>{session.user.email}</span>
          <Link href="/api/logout">Logout</Link>
        </>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </nav>
  );
}
