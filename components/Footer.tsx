'use client'

import Link from 'next/link'
import { Mail, Phone, Instagram, ArrowRight, MapPin } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Tentang', href: '#tentang' },
    { label: 'Cara Lapor', href: '#cara-lapor' },
    { label: 'FAQ', href: '#faq' }
  ]

  const authLinks = [
    { label: 'Login', href: '/login' },
    { label: 'Daftar', href: '/register' }
  ]

  const contactLinks = [
    { icon: Mail, label: 'Email', value: 'cs@pantau.in', href: 'mailto:cs@pantau.in' },
    { icon: Phone, label: 'WhatsApp', value: '+62 812-3456-7890', href: 'https://wa.me/6281234567890' },
    { icon: Instagram, label: 'Instagram', value: '@pantau.in', href: 'https://instagram.com/pantau.in' }
  ]

  return (
    <footer className="bg-gradient-to-br from-blue-700 via-blue-600 to-orange-700 text-white mt-16 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>

      <div className="relative z-10">
        {/* Top Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="mb-4">
                <div className="flex items-center justify-center w-50 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg">
                  <img src="/logo.png" alt="Logo" className="h-10 brightness-0 invert" />
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Platform penghubung antara masyarakat dan instansi pemerintah untuk menciptakan lingkungan yang lebih baik.
              </p>
              <div className="flex items-center gap-2 mt-4 text-orange-400">
                <MapPin size={16} />
                <span className="text-sm">Bandung, Indonesia</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></span>
                Navigasi
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link, i) => (
                  <li key={i}>
                    <Link 
                      href={link.href}
                      className="text-gray-300 hover:text-orange-400 transition-colors duration-300 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Auth Links */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></span>
                Akun
              </h3>
              <ul className="space-y-3">
                {authLinks.map((link, i) => (
                  <li key={i}>
                    <Link 
                      href={link.href}
                      className="text-gray-300 hover:text-orange-400 transition-colors duration-300 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></span>
                Kontak
              </h3>
              <ul className="space-y-3">
                {contactLinks.map((contact, i) => {
                  const Icon = contact.icon
                  return (
                    <li key={i}>
                      <a 
                        href={contact.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-orange-400 transition-all duration-300 flex items-start gap-3 group text-sm"
                      >
                        <Icon size={18} className="mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">{contact.label}</span>
                          <span className="font-medium">{contact.value}</span>
                        </div>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10"></div>

        {/* Bottom Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} Pantau.In. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a 
                href="https://facebook.com/pantau.in" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-400 transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3z" />
                </svg>
              </a>
              <a 
                href="https://twitter.com/pantau.in" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-400 transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}