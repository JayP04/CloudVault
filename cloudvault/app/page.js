import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-sky-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-sky-600 bg-clip-text text-transparent">
                CloudVault
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-700 to-sky-600 rounded-lg hover:from-blue-800 hover:to-sky-700 transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-8">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            Your photos, your privacy, your control
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-zinc-900 mb-6 tracking-tight">
            Store your memories
            <br />
            <span className="bg-gradient-to-r from-blue-700 via-sky-600 to-blue-700 bg-clip-text text-transparent">
              without the price tag
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-zinc-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            A privacy-first photo vault built for families and creators. 
            <span className="font-semibold text-zinc-900"> 10x cheaper</span> than iCloud and Google Photos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-700 to-sky-600 rounded-xl hover:from-blue-800 hover:to-sky-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Start Free Trial
            </Link>
            <Link
              href="#pricing"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-zinc-700 bg-white border-2 border-zinc-200 rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-all"
            >
              View Pricing
            </Link>
          </div>

          {/* Social Proof */}
          <p className="text-sm text-zinc-500">
            Trusted by families and photographers to securely store over <span className="font-semibold text-zinc-700">1TB</span> of memories
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
            Everything you need, nothing you don't
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Simple photo storage without the complexity or cost of Big Tech
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">Privacy First</h3>
            <p className="text-zinc-600 leading-relaxed">
              Your photos are encrypted and never used for AI training or advertising. You own your data, period.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">Radically Affordable</h3>
            <p className="text-zinc-600 leading-relaxed">
              Store 500GB for less than $1/month. No hidden fees, no surprise bills. Pay only for what you use.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">Auto-Organize</h3>
            <p className="text-zinc-600 leading-relaxed">
              Photos automatically sorted by date using EXIF data. Find your 2019 vacation photos in seconds.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">Works Everywhere</h3>
            <p className="text-zinc-600 leading-relaxed">
              Access from any device—phone, tablet, desktop. Install as a PWA for app-like experience.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">30-Day Trash</h3>
            <p className="text-zinc-600 leading-relaxed">
              Accidentally deleted? No problem. Photos stay in trash for 30 days before permanent deletion.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">Easy Sharing</h3>
            <p className="text-zinc-600 leading-relaxed">
              Invite family to view your photos. Simple permissions—they see what you share, nothing else.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            No hidden fees. No surprise charges. Just honest pricing.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white p-8 rounded-2xl border-2 border-zinc-200 hover:border-blue-300 transition-all">
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">Free</h3>
            <p className="text-zinc-600 mb-6">Perfect for getting started</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-zinc-900">$0</span>
              <span className="text-zinc-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-zinc-600">50 GB storage</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-zinc-600">Unlimited downloads</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-zinc-600">Auto-organize by date</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 text-sm font-semibold text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Standard Tier */}
          <div className="bg-gradient-to-br from-blue-700 to-sky-600 p-8 rounded-2xl border-2 border-blue-700 relative shadow-2xl transform scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
              MOST POPULAR
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Standard</h3>
            <p className="text-blue-100 mb-6">For families and creators</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$0.75</span>
              <span className="text-blue-100">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-100 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">500 GB storage</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-100 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white">Everything in Free</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-100 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white">Share with 5 family members</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-100 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white">Priority support</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 text-sm font-semibold text-blue-700 bg-white rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-white p-8 rounded-2xl border-2 border-zinc-200 hover:border-blue-300 transition-all">
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">Pro</h3>
            <p className="text-zinc-600 mb-6">For photographers</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-zinc-900">$3</span>
              <span className="text-zinc-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-zinc-600 font-medium">2 TB storage</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-zinc-600">Everything in Standard</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-zinc-600">Client galleries (coming soon)</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-zinc-600">Custom branding</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 text-sm font-semibold text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-16 text-center">
          <p className="text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">Compare:</span> iCloud 200GB = $2.99/month | Google One 200GB = $2.99/month | CloudVault 500GB = $0.75/month
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-blue-700 to-sky-600 rounded-3xl p-12 sm:p-16 text-center shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to take control of your photos?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join families and creators who've already saved hundreds on photo storage
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 text-base font-semibold text-blue-700 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-sky-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-lg font-bold text-zinc-900">CloudVault</span>
            </div>
            <p className="text-sm text-zinc-500">
              © 2025 CloudVault. Built with privacy in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}