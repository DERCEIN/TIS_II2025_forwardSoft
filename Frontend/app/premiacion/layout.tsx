"use client"

import { AdminRoute } from "@/components/ProtectedRoute"

export default function PremiacionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminRoute>
      {children}
    </AdminRoute>
  )
}

