"use client"

import { AdminOrCoordinadorRoute } from "@/components/ProtectedRoute"

export default function CertificadosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminOrCoordinadorRoute>
      {children}
    </AdminOrCoordinadorRoute>
  )
}

