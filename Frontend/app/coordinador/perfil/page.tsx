"use client"

import { useRef, useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { ProfileService } from "@/lib/api"
import Link from "next/link"
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"

export default function PerfilCoordinador() {
  const { user, refreshUser } = useAuth() as any
  const userId = user?.id
  const avatarFromUser = user?.avatar_url as string | undefined
  const initialName = (user?.name || user?.nombre || '') as string
  const initialEmail = (user?.email || '') as string
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submittingPwd, setSubmittingPwd] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [submittingAvatar, setSubmittingAvatar] = useState(false)
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const initials = (name || 'Usuario').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()
  
  // Función para obtener el avatar más reciente disponible
  const getLatestAvatar = () => {
    if (avatarPreview) return avatarPreview
    
    if (avatarFromUser) {
      
      if (avatarFromUser.startsWith('http')) {
        return avatarFromUser
      }
      
      const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo';
      return `${backendBase}${avatarFromUser.startsWith('/') ? '' : '/'}${avatarFromUser}`
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
      // Subir inmediatamente tras seleccionar
      await handleUploadAvatar(f)
    }
  }

  const handleChangePassword = async () => {
    if (!userId) return
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }
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

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const passwordsDontMatch = newPassword && confirmPassword && newPassword !== confirmPassword

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
            <p className="text-sm text-muted-foreground">Coordinador</p>
          </div>
          <Link href="/coordinador/dashboard" className="text-sm text-blue-600 pb-2">Volver al panel</Link>
        </div>
        <CardHeader>
          <CardTitle>Perfil - Coordinador</CardTitle>
          <CardDescription>Actualiza tu contraseña y foto de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 lg:col-span-1">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-base">Datos de perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Nombre completo</label>
                  <Input placeholder="Nombre completo" value={name} disabled readOnly className="bg-muted" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Correo electrónico</label>
                  <Input placeholder="Correo" type="email" value={email} disabled readOnly className="bg-muted" />
                </div>
                <p className="text-xs text-muted-foreground italic">
                  El nombre y correo electrónico no pueden ser modificados. Contacta al administrador si necesitas realizar cambios.
                </p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-base">Cambiar contraseña</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0">
                <div className="relative">
                  <Input 
                    type={showCurrentPassword ? "text" : "password"} 
                    placeholder="Contraseña actual" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    type={showNewPassword ? "text" : "password"} 
                    placeholder="Nueva contraseña" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirmar nueva contraseña" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pr-10 ${passwordsDontMatch ? 'border-red-500 focus-visible:ring-red-500' : passwordsMatch ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {passwordsMatch && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                  {passwordsDontMatch && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 text-red-500">
                      <XCircle className="h-4 w-4" />
                    </div>
                  )}
                </div>
                {passwordsDontMatch && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Las contraseñas no coinciden
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Las contraseñas coinciden
                  </p>
                )}
                <Button 
                  onClick={handleChangePassword} 
                  disabled={submittingPwd || !userId || !currentPassword || !newPassword || !confirmPassword || passwordsDontMatch}
                >
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


