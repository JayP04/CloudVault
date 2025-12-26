// import { createClient } from '@/lib/supabase/server'
// import { redirect } from 'next/navigation'
// import LogoutButton from '@/components/LogoutButton'

// export default async function DashboardLayout({ children }) {
//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()

//   if (!user) {
//     redirect('/login')
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <nav className="bg-white shadow-sm">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex justify-between h-16">
//               <div className="flex items-center space-x-8">
//                 <h1 className="text-xl font-bold text-gray-900">CloudVault</h1>
//                 <div className="flex space-x-4">
//                   <a
//                     href="/dashboard"
//                     className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
//                   >
//                     Photos
//                   </a>
//                   <a
//                     href="/trash"
//                     className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
//                   >
//                     Trash
//                   </a>
//                 </div>
//               </div>
//               <div className="flex items-center space-x-4">
//                 <span className="text-sm text-gray-600">{user.email}</span>
//                 <LogoutButton />
//               </div>
//             </div>
//           </div>
//         </nav>
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {children}
//       </main>
//     </div>
//   )
// }

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Sidebar */}
      <Sidebar user={user} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}