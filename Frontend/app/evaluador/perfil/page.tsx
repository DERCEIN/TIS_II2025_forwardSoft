"use client"

import { useRef, useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { ProfileService } from "@/lib/api"
import Link from "next/link"

export default function PerfilEvaluador() {
  const { user, refreshUser } = useAuth() as any
  const userId = user?.id
  const avatarFromUser = user?.avatar_url as string | undefined
  const initialName = (user?.name || user?.nombre || '') as string
  const initialEmail = (user?.email || '') as string
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submittingPwd, setSubmittingPwd] = useState(false)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [submittingAvatar, setSubmittingAvatar] = useState(false)
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const initials = (name || 'Usuario').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()
  const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  
  const getLatestAvatar = () => {
    if (avatarPreview) return avatarPreview
    
    if (avatarFromUser && backendBase) {
      return `${backendBase}${avatarFromUser}`
    }
    
    return null
  }
  
  const resolvedAvatar = getLatestAvatar()


  
  useEffect(() => {
    if (user) {
      const newName = (user?.name || user?.nombre || '') as string
      const newEmail = (user?.email || '') as string
      
      setName(newName)
      setEmail(newEmail)
    }
  }, [user])

  const handlePickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setAvatarFile(f)
      setAvatarPreview(URL.createObjectURL(f))
      await handleUploadAvatar(f)
    }
  }

  const handleChangePassword = async () => {
    if (!userId) return
    try {
      setSubmittingPwd(true)
      await ProfileService.changePassword(Number(userId), {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      alert("Contraseña actualizada")
    } catch (e: any) {
      alert(e?.message || "Error al actualizar contraseña")
    } finally {
      setSubmittingPwd(false)
    }
  }

  const handleUploadAvatar = async (fileParam?: File) => {
    const fileToUpload = fileParam || avatarFile
    if (!fileToUpload) return
    try {
      setSubmittingAvatar(true)
      const res = await ProfileService.uploadAvatar(fileToUpload)
      if (res?.data?.warning) alert(res.data.warning)
      alert("Avatar actualizado")
      try { await refreshUser() } catch {}
    } catch (e: any) {
      alert(e?.message || "Error al subir avatar")
    } finally {
      setSubmittingAvatar(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Card className="overflow-hidden">
        <div className="h-28 w-full" style={{background: 'linear-gradient(90deg,#dbeafe,#fce7f3)'}} />
        <div className="-mt-12 px-6 flex items-end gap-4">
          <button type="button" onClick={()=>inputRef.current?.click()} className="relative h-24 w-24 rounded-full ring-2 ring-white overflow-hidden bg-gray-100 flex items-center justify-center group">
            {resolvedAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolvedAvatar!} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-semibold text-blue-700">{initials}</span>
            )}
            <div className="absolute inset-0 hidden group-hover:flex items-end justify-center bg-black/20">
              <span className="mb-2 text-[10px] px-2 py-1 rounded bg-white/90 text-gray-700">Cambiar foto</span>
            </div>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePickAvatar} className="hidden" />
          </button>
          <div className="flex-1 pb-2">
            <h2 className="text-xl font-bold">{name || 'Mi Perfil'}</h2>
            <p className="text-sm text-muted-foreground">Evaluador</p>
          </div>
          <Link href="/evaluador/dashboard" className="text-sm text-blue-600 pb-2">Volver al panel</Link>
        </div>
        <CardHeader>
          <CardTitle>Perfil - Evaluador</CardTitle>
          <CardDescription>Actualiza tu contraseña y foto de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4 lg:col-span-1">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-base">Datos de perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0">
                <Input placeholder="Nombre completo" value={name} onChange={(e)=>setName(e.target.value)} />
                <Input placeholder="Correo" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
                <Button disabled={!userId} onClick={async()=>{
                  try { await ProfileService.updateProfile(Number(userId), { name, email }); alert('Perfil actualizado') } catch(e:any){ alert(e?.message||'Error al actualizar perfil') }
                }}>Guardar perfil</Button>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-base">Cambiar contraseña</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0">
                <Input type="password" placeholder="Contraseña actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <Input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Input type="password" placeholder="Confirmar nueva contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <Button onClick={handleChangePassword} disabled={submittingPwd || !userId}>
                  {submittingPwd ? "Guardando..." : "Guardar contraseña"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


