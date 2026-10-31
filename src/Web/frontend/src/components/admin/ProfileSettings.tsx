import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../../store/authStore"
import { Save, User, Lock, KeyRound, Loader2 } from "lucide-react"
import { AdminLoader } from "./AdminLoader"

export function ProfileSettings() {
  const token = useAuthStore((state) => state.token)
  const setToken = useAuthStore((state) => state.setToken)
  const queryClient = useQueryClient()
  const baseUrl = "/api"

  const [formData, setFormData] = useState({
    fullName: "",
    title: "",
    bio: "",
    avatarKey: "",
    cvPdfKey: "",
    githubLink: "",
    linkedinLink: "",
  })
  const [savedSuccess, setSavedSuccess] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [pwdMessage, setPwdMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/content/profile`)
      if (!res.ok) return null
      return res.json()
    },
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        title: profile.title || "",
        bio: profile.bio || "",
        avatarKey: profile.avatarKey || "",
        cvPdfKey: profile.cvPdfKey || "",
        githubLink: profile.githubLink || "",
        linkedinLink: profile.linkedinLink || "",
      })
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`${baseUrl}/content/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update profile")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMessage(null)

    if (passwordData.newPassword.length < 8) {
      setPwdMessage({
        type: "error",
        text: "Mật khẩu mới phải có ít nhất 8 ký tự.",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPwdMessage({
        type: "error",
        text: "Xác nhận mật khẩu mới không khớp.",
      })
      return
    }

    setPwdLoading(true)
    try {
      const res = await fetch(`${baseUrl}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setPwdMessage({
          type: "error",
          text: data.error || "Đổi mật khẩu thất bại.",
        })
      } else {
        // Changing the password revokes older tokens; keep this session alive with the fresh one.
        if (data.token) setToken(data.token)
        setPwdMessage({
          type: "success",
          text: "PASSWORD_UPDATED_SUCCESSFULLY!",
        })
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch {
      setPwdMessage({ type: "error", text: "Lỗi kết nối máy chủ." })
    } finally {
      setPwdLoading(false)
    }
  }

  if (isLoading) {
    return <AdminLoader label="LOADING_PROFILE_CONFIG..." variant="form" />
  }

  return (
    <div className="font-mono max-w-3xl space-y-8 sm:space-y-12">
      <div>
        <div className="flex items-center space-x-3 mb-5 sm:mb-6">
          <User className="w-6 h-6 sm:w-7 sm:h-7 adm-text-accent shrink-0" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight adm-text break-words">
            PROFILE_CONFIGURATION
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="adm-card p-4 sm:p-6 rounded-lg space-y-5 sm:space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="adm-label">FULL_NAME</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="adm-input"
                required
              />
            </div>
            <div>
              <label className="adm-label">TITLE</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="adm-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="adm-label">BIO</label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              className="adm-input h-28"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="adm-label">GITHUB_LINK</label>
              <input
                type="text"
                value={formData.githubLink}
                onChange={(e) =>
                  setFormData({ ...formData, githubLink: e.target.value })
                }
                className="adm-input"
              />
            </div>
            <div>
              <label className="adm-label">LINKEDIN_LINK</label>
              <input
                type="text"
                value={formData.linkedinLink}
                onChange={(e) =>
                  setFormData({ ...formData, linkedinLink: e.target.value })
                }
                className="adm-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="adm-label">AVATAR_KEY</label>
              <input
                type="text"
                value={formData.avatarKey}
                onChange={(e) =>
                  setFormData({ ...formData, avatarKey: e.target.value })
                }
                className="adm-input"
              />
            </div>
            <div>
              <label className="adm-label">CV_PDF_KEY</label>
              <input
                type="text"
                value={formData.cvPdfKey}
                onChange={(e) =>
                  setFormData({ ...formData, cvPdfKey: e.target.value })
                }
                className="adm-input"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t adm-divider">
            <div>
              {savedSuccess && (
                <span className="adm-text-success text-xs font-bold">
                  &gt; PROFILE_SAVED_SUCCESSFULLY!
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="adm-btn-primary text-xs w-full sm:w-auto"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {updateMutation.isPending ? "SAVING..." : "SAVE_CONFIGURATION"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="adm-card p-4 sm:p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-5 sm:mb-6">
          <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 adm-text-accent shrink-0" />
          <h2 className="text-base sm:text-xl font-bold tracking-tight adm-text break-words">
            SECURITY_CONFIGURATION // CHANGE_PASSWORD
          </h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5 sm:space-y-6">
          <div>
            <label className="adm-label">CURRENT_PASSWORD</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="adm-input"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="adm-label">NEW_PASSWORD (MIN 8 CHARS)</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                className="adm-input"
                required
              />
            </div>
            <div>
              <label className="adm-label">CONFIRM_NEW_PASSWORD</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                className="adm-input"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t adm-divider">
            <div>
              {pwdMessage && (
                <span
                  className={`text-xs font-bold ${
                    pwdMessage.type === "success"
                      ? "adm-text-success"
                      : "adm-text-danger"
                  }`}
                >
                  &gt; {pwdMessage.text}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={pwdLoading}
              className="adm-btn-primary text-xs w-full sm:w-auto"
            >
              {pwdLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>{pwdLoading ? "UPDATING..." : "UPDATE_PASSWORD"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
