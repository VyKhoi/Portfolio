import { Link } from "react-router-dom"
import { useLang, useT } from "../../lib/i18n"
import { PRIVACY_PATH } from "../../content/privacy"

export function Footer() {
  const lang = useLang()
  const t = useT()
  return (
    <footer className="py-8 px-8 bg-obsidian border-t border-border text-center">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 font-mono text-sm">
        <p className="text-text-muted">
          © {new Date().getFullYear()} Đặng Vỹ Khôi
        </p>
        <Link to={PRIVACY_PATH[lang]} className="text-text-muted hover:text-primary underline-offset-4 hover:underline transition-colors">
          {t.privacy}
        </Link>
      </div>
    </footer>
  )
}
