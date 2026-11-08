import { Link } from "react-router-dom"
import { useLang, useT } from "../../lib/i18n"
import { PRIVACY_PATH } from "../../content/privacy"

export function Footer() {
  const lang = useLang()
  const t = useT()
  return (
    <footer className="py-8 px-8 bg-[#0A0A0C] border-t border-[#27272A] text-center">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 font-mono text-sm">
        <p className="text-zinc-400">
          © {new Date().getFullYear()} Đặng Vỹ Khôi
        </p>
        <Link to={PRIVACY_PATH[lang]} className="text-zinc-400 hover:text-[#DEFF9A] underline-offset-4 hover:underline transition-colors">
          {t.privacy}
        </Link>
      </div>
    </footer>
  )
}
