import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ContactApi } from '../../lib/api';
import { useLang, useT } from '../../lib/i18n';
import { PRIVACY_PATH } from '../../content/privacy';

export function ContactSection() {
  const t = useT();
  const lang = useLang();
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [companyTrap, setCompanyTrap] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;
    if (!consent) {
      setError(t.consentNeeded);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await ContactApi.submitMessage({
        ...formData,
        consent,
        companyTrap
      });
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setCompanyTrap('');
      setConsent(false);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("Failed to submit contact message:", err);
      setError(err?.response?.status === 429 ? t.tooMany : t.sendFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="relative bg-surface overflow-hidden border-t border-border">

      <div className="grid lg:grid-cols-2 min-h-[80vh]">

        {/* Left: Contact Info - Giant Typography */}
        <div className="p-6 sm:p-10 lg:p-24 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border relative">
          <div className="absolute inset-0 bg-primary/5 z-0" />

          <div className="relative z-10">
            <h2 className="text-[2.75rem] sm:text-[4rem] md:text-[5rem] lg:text-[7rem] font-bold font-heading uppercase leading-[0.88] tracking-tighter text-text-main mb-8 lg:mb-12 break-words">
              {t.contactTitle[0]}<br />
              <span className="text-outline-primary">{t.contactTitle[1]}</span><br />
              {t.contactTitle[2]}
            </h2>

            <p className="text-text-muted mb-10 lg:mb-16 text-base sm:text-lg max-w-md font-body leading-relaxed">
              {t.contactIntro}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 font-mono text-sm">
              <div className="flex flex-col space-y-1.5 sm:space-y-2">
                <span className="text-primary font-bold tracking-widest uppercase text-xs sm:text-sm">{t.phone}</span>
                <a href="tel:+84931314792" className="text-text-main hover:text-primary transition-colors">0931 314 792</a>
              </div>
              <div className="flex flex-col space-y-1.5 sm:space-y-2">
                <span className="text-primary font-bold tracking-widest uppercase text-xs sm:text-sm">Email</span>
                <a href="mailto:dangvykhoi@gmail.com" className="text-text-main hover:text-primary transition-colors break-all">dangvykhoi@gmail.com</a>
              </div>
              <div className="flex flex-col space-y-1.5 sm:space-y-2">
                <span className="text-primary font-bold tracking-widest uppercase text-xs sm:text-sm">LinkedIn</span>
                <a href="https://linkedin.com/in/vykhoi" target="_blank" rel="noreferrer" className="text-text-main hover:text-primary transition-colors">/in/vykhoi</a>
              </div>
              <div className="flex flex-col space-y-1.5 sm:space-y-2">
                <span className="text-primary font-bold tracking-widest uppercase text-xs sm:text-sm">{t.address}</span>
                <span className="text-text-main">{t.addressValue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact Form - Stark Geometric */}
        <div className="p-6 sm:p-10 lg:p-24 flex flex-col justify-center bg-obsidian relative">
          <h3 className="text-xl sm:text-2xl font-bold font-heading text-text-main uppercase mb-8 lg:mb-12 flex items-center">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-primary mr-3 sm:mr-4 shrink-0" />
            {t.sendMessage}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <input
              type="text"
              name="company_trap"
              value={companyTrap}
              onChange={(e) => setCompanyTrap(e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div className="relative">
              <Input
                id="contact-name"
                placeholder=" "
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                maxLength={100}
                required
                className="peer pt-6 pb-2 h-16 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus-visible:border-primary px-0 text-text-main font-mono"
              />
              <label htmlFor="contact-name" className="absolute left-0 top-6 text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-text-muted transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary peer-valid:-top-2 peer-valid:text-xs peer-valid:text-primary pointer-events-none">
                {t.fullName}
              </label>
            </div>

            <div className="relative">
              <Input
                id="contact-email"
                type="email"
                placeholder=" "
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                maxLength={100}
                required
                className="peer pt-6 pb-2 h-16 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus-visible:border-primary px-0 text-text-main font-mono"
              />
              <label htmlFor="contact-email" className="absolute left-0 top-6 text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-text-muted transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary peer-valid:-top-2 peer-valid:text-xs peer-valid:text-primary pointer-events-none">
                Email
              </label>
            </div>

            <div className="relative pt-4">
              <textarea
                id="contact-message"
                className="peer flex w-full border-b border-border bg-transparent py-2 text-sm text-text-main font-mono transition-colors focus-visible:outline-none focus-visible:border-primary min-h-[100px] resize-none"
                placeholder=" "
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                maxLength={1000}
                required
              />
              <label htmlFor="contact-message" className="absolute left-0 top-6 text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-text-muted transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary peer-valid:-top-2 peer-valid:text-xs peer-valid:text-primary pointer-events-none">
                {t.message}
              </label>
            </div>

            <label className="flex items-start gap-3 text-xs sm:text-sm text-text-muted font-body leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setError(''); }}
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#DEFF9A] cursor-pointer"
              />
              <span>
                {t.consent[0]}
                <Link to={PRIVACY_PATH[lang]} className="text-primary underline underline-offset-2 hover:opacity-80">{t.consent[1]}</Link>
                {t.consent[2]}
              </span>
            </label>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full lg:w-auto mt-4"
            >
              {loading ? t.sending : success ? t.sent : t.send}
            </Button>

            <p role="status" className={`font-mono text-xs sm:text-sm min-h-5 ${error ? 'text-primary' : 'text-text-muted'}`}>
              {error || (success ? t.sentNote : '')}
            </p>
          </form>
        </div>

      </div>
    </section>
  );
}
