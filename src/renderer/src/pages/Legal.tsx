import {
  ShieldCheck,
  ArrowLeft,
  ScrollText,
  Users,
  Lock,
  Globe,
  Copyright,
  UserX,
  Cookie,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { pageVariants, staggerContainer, fadeInUp } from '../utils/animations'

interface PolicySection {
  icon: React.ReactNode
  title: string
  gradient?: string
  content: React.ReactNode
}

export const Legal: React.FC = () => {
  const navigate = useNavigate()

  const sections: PolicySection[] = [
    {
      icon: <ScrollText className="w-4 h-4 text-indigo-500" />,
      title: 'Terms of Service',
      gradient:
        'bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border-indigo-100',
      content: (
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            Welcome to{' '}
            <strong className="text-slate-800">Sky Express Virtual Airlines</strong>. By using
            this application, you agree to comply with our community guidelines and virtual
            aviation regulations.
          </p>
          <p>
            This software strictly simulates aviation for entertainment purposes. It is{' '}
            <strong className="text-pink-600">not affiliated</strong> with any real-world airline
            or aviation authority. The data provided in this application (including live tracking
            and OFP generation) must never be used for real-world flight operations.
          </p>
          <p>
            We reserve the right to revoke access to the VA network for users who violate our
            community terms, including harassment, cheating on flight tracking, or displaying
            inappropriate conduct on integrated networks like VATSIM.
          </p>
          <p>
            Sky Express VA is provided on an &quot;as-is&quot; basis without warranty of any kind,
            express or implied. We do not guarantee uninterrupted access to our services, and
            reserve the right to modify or discontinue functionality at any time without prior
            notice.
          </p>
        </div>
      )
    },
    {
      icon: <Users className="w-4 h-4 text-slate-400" />,
      title: 'Community Guidelines',
      content: (
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            As a member of the Sky Express VA community, you are expected to maintain a standard
            of professionalism and respect at all times. The following behaviours are strictly
            prohibited and may result in suspension or permanent removal:
          </p>
          <ul className="space-y-2">
            {[
              'Harassment, bullying, hate speech, or discriminatory language directed at other pilots or staff members.',
              'Manipulating or falsifying flight tracking data, PIREP submissions, or financial balances within the VA system.',
              'Impersonation of real-world airlines, ATC services, or other VA organisations while using Sky Express callsigns or identifiers on VATSIM or other online networks.',
              'Sharing, distributing, or reverse-engineering any proprietary components of the Sky Express VA application without authorisation.',
              'Exploiting bugs, vulnerabilities, or unintended behaviour in the application for personal gain instead of reporting them to the development team.'
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>
            Violations are reviewed by the VA administration team. Decisions on disciplinary
            actions are final and at the sole discretion of the Sky Express VA staff.
          </p>
        </div>
      )
    },
    {
      icon: <Lock className="w-4 h-4 text-slate-400" />,
      title: 'Privacy Policy',
      content: (
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            Your privacy is important to us. This application collects minimal data required for
            your virtual airline career:
          </p>
          <ul className="space-y-2">
            {[
              'Basic authentication information linked to your Discord profile via Supabase, including your Discord username, avatar, and unique identifier.',
              'Virtual flight telemetry collected during your simulated flights to calculate your VA statistics, flight hours, landing scores, and account balance.',
              'Optional third-party identifiers (SimBrief Username, VATSIM CID) provided by you to enable OFP generation and live network tracking integrations.',
              'Application usage metadata such as login timestamps and feature interaction data, used exclusively for improving the user experience.'
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>
            We do <strong className="text-slate-800">not</strong> share your personal data with
            third parties for marketing purposes. Your profile callsign and flight statistics
            will be visible to other Sky Express VA pilots inside the application.
          </p>
          <p>
            You may request full deletion of your data by contacting the VA administration team
            through our official Discord server. Data deletion requests will be processed within
            30 days.
          </p>
        </div>
      )
    },
    {
      icon: <Globe className="w-4 h-4 text-slate-400" />,
      title: 'Third-Party Services & Integrations',
      content: (
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            Sky Express VA integrates with the following third-party services. Each service is
            governed by its own terms and privacy policy:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                name: 'Supabase',
                desc: 'Cloud database and authentication provider. Handles secure login via Discord OAuth and stores your pilot profile and flight records.',
                color: 'from-emerald-500 to-teal-500'
              },
              {
                name: 'SimBrief',
                desc: 'Flight planning service. When you provide your SimBrief credentials, the application fetches your latest Operational Flight Plan (OFP).',
                color: 'from-amber-500 to-orange-500'
              },
              {
                name: 'VATSIM',
                desc: 'Online multiplayer flight simulation network. Your VATSIM CID is used to display your live position on the VATSIM radar overlay.',
                color: 'from-blue-500 to-indigo-500'
              },
              {
                name: 'Discord',
                desc: 'Community platform used for authentication (OAuth2) and pilot communication. We access only the profile information you authorise.',
                color: 'from-violet-500 to-purple-500'
              }
            ].map((svc) => (
              <div
                key={svc.name}
                className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2 h-2 rounded-full bg-gradient-to-br ${svc.color} shrink-0`}
                  />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {svc.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
          <p>
            Sky Express VA is not responsible for the practices or content of these third-party
            services. We recommend reviewing their respective terms before enabling integrations.
          </p>
        </div>
      )
    },
    {
      icon: <Copyright className="w-4 h-4 text-slate-400" />,
      title: 'Intellectual Property',
      content: (
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            The Sky Express VA name, logos, branding, and original artwork displayed within this
            application are the intellectual property of the Sky Express Virtual Airlines team.
            Unauthorised reproduction, redistribution, or modification of these assets is
            strictly prohibited.
          </p>
          <p>
            The application software, including its source code, user interface design, and
            underlying architecture, is proprietary. You may not decompile, reverse-engineer, or
            create derivative works without express written permission from the development team.
          </p>
          <p>
            Flight simulation aircraft, scenery, and related assets displayed within the
            application remain the property of their respective creators and publishers (e.g.,
            Microsoft, Asobo Studio). Sky Express VA makes no claim of ownership over third-party
            simulation content.
          </p>
        </div>
      )
    },
    {
      icon: <UserX className="w-4 h-4 text-slate-400" />,
      title: 'Account & Termination',
      content: (
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            Your Sky Express VA pilot account is personal and non-transferable. You are
            responsible for maintaining the security of your login credentials and must not share
            your account with others.
          </p>
          <p>
            The VA administration reserves the right to suspend or permanently terminate accounts
            found in violation of these terms or community guidelines. In the event of
            termination, any accumulated virtual balance, rank progression, or flight records may
            be forfeited.
          </p>
          <p>
            You may voluntarily deactivate your account at any time by contacting the VA staff
            through Discord. Upon deactivation, your personal data will be scheduled for deletion
            in accordance with our Privacy Policy.
          </p>
        </div>
      )
    },
    {
      icon: <Cookie className="w-4 h-4 text-slate-400" />,
      title: 'Cookie & Local Storage Policy',
      content: (
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            This application utilizes local browser storage (such as localStorage and secure
            session tokens) to maintain your login state, preferences, and offline status
            markers. Specifically, we store:
          </p>
          <ul className="space-y-2">
            {[
              'Authentication session tokens to keep you logged in between sessions.',
              'User preference flags (e.g., tutorial completion status, UI settings).',
              'Cached flight data for offline access and performance optimisation.'
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>
            By using the Sky Express VA application, you consent to the storage of essential
            functional data on your device. We do{' '}
            <strong className="text-slate-800">not</strong> use third-party tracking cookies,
            analytics services, or advertising pixels.
          </p>
        </div>
      )
    },
    {
      icon: <AlertTriangle className="w-4 h-4 text-slate-400" />,
      title: 'Disclaimer of Liability',
      content: (
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            Sky Express Virtual Airlines is a hobby-based, non-commercial project created by
            flight simulation enthusiasts. We make no representations or warranties regarding the
            accuracy, reliability, or completeness of any data presented in this application.
          </p>
          <p>
            Under no circumstances shall the Sky Express VA team be liable for any direct,
            indirect, incidental, or consequential damages arising from the use or inability to
            use this application, including but not limited to loss of data, virtual currency, or
            flight records.
          </p>
          <p>
            Flight data, weather information, navigation charts, and operational flight plans
            generated through this application are for simulation purposes only and must never be
            used for real-world aviation decision-making.
          </p>
        </div>
      )
    },
    {
      icon: <RefreshCw className="w-4 h-4 text-slate-400" />,
      title: 'Changes to These Policies',
      content: (
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            We may update these policies from time to time to reflect changes in our practices,
            new features, or regulatory requirements. All changes will take effect immediately
            upon being posted within the application.
          </p>
          <p>
            Continued use of the Sky Express VA application after any policy update constitutes
            your acceptance of the revised terms. We encourage you to review this page
            periodically.
          </p>
          <p>
            For questions, concerns, or requests regarding these policies, please contact the VA
            administration team through our official{' '}
            <strong className="text-slate-800">Discord server</strong>.
          </p>
        </div>
      )
    }
  ]

  return (
    <motion.div
      className="p-6 h-full flex flex-col gap-6 font-sans bg-slate-50 overflow-y-auto overflow-x-hidden"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-sky-600" />
          Legal & Policies
        </h1>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5 w-full max-w-5xl mx-auto"
      >
        {sections.map((section, index) => (
          <motion.div
            key={index}
            variants={fadeInUp}
            className={`rounded-3xl p-6 shadow-sm border relative overflow-hidden transition-shadow hover:shadow-md ${
              section.gradient || 'bg-white border-slate-200'
            }`}
          >
            {/* Decorative top accent on first card */}
            {index === 0 && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            )}

            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100/80 pb-3 mb-4 flex items-center gap-2">
              {section.icon}
              {section.title}
            </h2>

            {section.content}
          </motion.div>
        ))}

        {/* Footer */}
        <motion.div variants={fadeInUp} className="text-center py-4 pb-8">
          <p className="text-xs font-medium text-slate-400">
            Last updated: March 2026 · Sky Express Virtual Airlines · All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
