import { Button } from '@/components/ui/button';
import { MenuIcon, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore'; 

interface SidebarProps {
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAuthenticated, isAuthInitialized }) => {
  const pathname = usePathname();
  const router = useRouter(); // For redirection after logout
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Get logout action from the store
  const { logout } = useAuthStore();

  // Lock scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup function to restore scroll on component unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await logout(); 
    toggleMenu(); 
    router.push('/auth/login');
  };

  const handleLinkClick = () => {
    toggleMenu();
  };

  return (
    <div className='font-poppins'>
      {/* Menu Toggle Button */}
      <div className='lg:hidden flex items-center'>
        <button
          onClick={toggleMenu}
          className='text-white cursor-pointer hover:text-teal-300 transition focus:outline-none'
          aria-label='Toggle menu'
        >
          {isMenuOpen ? <X size={30} /> : <MenuIcon size={30} />}
        </button>
      </div>

      {/* Sidebar Menu Content */}
      {isMenuOpen && (
        <div className='lg:hidden absolute top-[73px] h-[90vh] left-0 right-0 bg-[#04293a] z-50 flex flex-col justify-between py-10 gap-4 text-[20px] overflow-y-auto transition-all duration-300 ease-in-out'>

          {/* Public Links */}
          <Link href='/' onClick={handleLinkClick}>
            <div className={`cursor-pointer pl-6 py-2 ${pathname === '/' ? "text-teal-400 font-bold" : "text-[#FFFFFF]" } hover:text-teal-300 transition`}>
              Home
            </div>
          </Link>
          <div className='w-full border-t border-[#FFFFFF80]'></div>

          <Link href='/pricings' onClick={handleLinkClick}>
            <div className={`cursor-pointer py-2 pl-6 ${pathname === '/pricings' ? "text-teal-400 font-bold" : "text-[#FFFFFF]" } hover:text-teal-300 transition`}>
              Our offerings
            </div>
          </Link>
          <div className='w-full border-t border-[#FFFFFF80]'></div>

          <Link href='/about-us' onClick={handleLinkClick}>
            <div className={`cursor-pointer py-2 pl-6 ${pathname === '/about-us' ? "text-teal-400 font-bold" : "text-[#FFFFFF]" } hover:text-teal-300 transition`}>
              About Us
            </div>
          </Link>
          <div className='w-full border-t border-[#FFFFFF80]'></div>

          <Link href='/partners' onClick={handleLinkClick}>
            <div className={`cursor-pointer py-2 pl-6 ${pathname === '/partners' ? "text-teal-400 font-bold" : "text-[#FFFFFF]" } hover:text-teal-300 transition`}>
              Partners
            </div>
          </Link>
          <div className='w-full border-t border-[#FFFFFF80]'></div>

          <Link href='/blogs' onClick={handleLinkClick}>
            <div className={`cursor-pointer py-2 pl-6 ${pathname === '/blogs' ? "text-teal-400 font-bold" : "text-[#FFFFFF]" } hover:text-teal-300 transition`}>
              Blogs
            </div>
          </Link>
          <div className='w-full border-t border-[#FFFFFF80]'></div>

          {/* Protected Links - Show only if authenticated */}
          {isAuthenticated && (
            <>
              <Link href='/all-videos' onClick={handleLinkClick}>
                <div className={`cursor-pointer py-2 pl-6 ${pathname === '/all-videos' ? "text-teal-400 font-bold" : "text-[#FFFFFF]" } hover:text-teal-300 transition`}>
                  
                  FlexPick Plan
                </div>
              </Link>
              <div className='w-full border-t border-[#FFFFFF80]'></div>

              <Link href='/customer-dashboard' onClick={handleLinkClick}>
                <div className={`cursor-pointer py-2 pl-6 ${pathname === '/customer-dashboard' ? "text-teal-400 font-bold" : "text-[#FFFFFF]" } hover:text-teal-300 transition`}>
                  Dashboard
                </div>
              </Link>
              <div className='w-full border-t border-[#FFFFFF80]'></div>
            </>
          )}

          {/* Authentication Buttons - Conditional rendering */}
          <div className='pl-6 py-4'> {/* Push auth button towards bottom */}
             {!isAuthInitialized ? (
                 // Optional: Show a loading state
                 <Button variant="custom" disabled className='font-medium font-lato cursor-pointer w-fit text-[20px] p-5 mb-12'>Loading...</Button>
             ) : isAuthenticated ? (
                 // Show Logout button if authenticated
                 <Button
                    variant="custom"
                    onClick={handleLogout} // Use the handler
                    className='font-medium cursor-pointer w-fit text-[20px] p-5 mb-12 bg-red-600 hover:bg-red-700'
                 >
                    LOGOUT
                 </Button>
             ) : (
                 // Show Login button if not authenticated
                 <Link href='/auth/login' onClick={handleLinkClick}>
                    <Button variant="custom" className='font-medium font-lato cursor-pointer w-fit text-[20px] p-5 mb-12'>LOGIN</Button>
                 </Link>
             )}
          </div>

        </div>
      )}
    </div>
  )
}

export default Sidebar;