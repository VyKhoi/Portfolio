import React, { useState, useEffect } from 'react';
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { ContactApi } from '../../lib/api';
import * as signalR from '@microsoft/signalr';

export function ContactSection() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/hubs/notification`)
      .withAutomaticReconnect()
      .build();

    connection.on("ContactReceived", () => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      setFormData({ name: '', email: '', message: '' });
    });

    connection.start().catch(err => console.error("SignalR Connection Error: ", err));

    return () => {
      connection.stop();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    ContactApi.submitMessage(formData).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }

  return (
    <section id="contact" className="relative bg-surface overflow-hidden border-t border-border">
      
      <div className="grid lg:grid-cols-2 min-h-[80vh]">
        
        {/* Left: Contact Info - Giant Typography */}
        <div className="p-8 lg:p-24 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border relative">
          <div className="absolute inset-0 bg-primary/5 z-0" />
          
          <div className="relative z-10">
            <h2 className="text-5xl sm:text-[4rem] md:text-[5rem] lg:text-[7rem] font-bold font-heading uppercase leading-[0.85] tracking-tighter text-text-main mb-12 break-words">
              BẮT ĐẦU<br />
              <span className="text-outline-primary">DỰ ÁN</span><br />
              MỚI.
            </h2>
            
            <p className="text-text-muted mb-16 text-lg max-w-md font-body">
              Bạn đang tìm kiếm một kỹ sư phần mềm tập trung vào hiệu suất và kiến trúc vững chắc? Hãy kết nối với tôi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-mono text-sm">
              <div className="flex flex-col space-y-2">
                <span className="text-primary font-bold tracking-widest uppercase">Điện thoại</span>
                <span className="text-text-main">0931 314 792</span>
              </div>
              <div className="flex flex-col space-y-2">
                <span className="text-primary font-bold tracking-widest uppercase">Email</span>
                <span className="text-text-main">dangvykhoi@gmail.com</span>
              </div>
              <div className="flex flex-col space-y-2">
                <span className="text-primary font-bold tracking-widest uppercase">LinkedIn</span>
                <a href="https://linkedin.com/in/vykhoi" target="_blank" className="text-text-main hover:text-primary transition-colors">/in/vykhoi</a>
              </div>
              <div className="flex flex-col space-y-2">
                <span className="text-primary font-bold tracking-widest uppercase">Địa chỉ</span>
                <span className="text-text-main">Go Vap, HCMC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact Form - Stark Geometric */}
        <div className="p-8 lg:p-24 flex flex-col justify-center bg-obsidian relative">
          <h3 className="text-2xl font-bold font-heading text-text-main uppercase mb-12 flex items-center">
            <div className="w-4 h-4 bg-primary mr-4" />
            Gửi Tin Nhắn
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative">
              <Input 
                placeholder=" " 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
                className="peer pt-6 pb-2 h-16 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus-visible:border-primary px-0 text-text-main font-mono"
              />
              <label className="absolute left-0 top-6 text-sm font-mono font-bold uppercase tracking-widest text-text-muted transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary peer-valid:-top-2 peer-valid:text-xs peer-valid:text-primary pointer-events-none">
                Họ và Tên
              </label>
            </div>
            
            <div className="relative">
              <Input 
                type="email" 
                placeholder=" " 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
                className="peer pt-6 pb-2 h-16 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus-visible:border-primary px-0 text-text-main font-mono"
              />
              <label className="absolute left-0 top-6 text-sm font-mono font-bold uppercase tracking-widest text-text-muted transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary peer-valid:-top-2 peer-valid:text-xs peer-valid:text-primary pointer-events-none">
                Email
              </label>
            </div>
            
            <div className="relative pt-4">
              <textarea 
                className="peer flex w-full border-b border-border bg-transparent py-2 text-sm text-text-main font-mono transition-colors focus-visible:outline-none focus-visible:border-primary min-h-[100px] resize-none"
                placeholder=" "
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              />
              <label className="absolute left-0 top-6 text-sm font-mono font-bold uppercase tracking-widest text-text-muted transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary peer-valid:-top-2 peer-valid:text-xs peer-valid:text-primary pointer-events-none">
                Nội dung
              </label>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || success} 
              className="w-full lg:w-auto mt-4"
            >
              {loading ? "ĐANG GỬI..." : success ? "ĐÃ GỬI THÀNH CÔNG" : "GỬI TIN NHẮN TRỰC TIẾP"}
            </Button>
          </form>
        </div>

      </div>
    </section>
  )
}
