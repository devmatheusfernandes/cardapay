// app/dashboard/waiter/layout.tsx
'use client';

import { TableProvider } from '@/lib/context/TableContext';

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TableProvider>{children}</TableProvider>;
}