import { Plus, MessageSquare, LogIn, LogOut, User as UserIcon, Search, Menu, X } from 'lucide-react';
import { User } from 'firebase/auth';
import { signInWithGoogle, auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useState } from 'react';

interface HeaderProps {
  onAddNew: () => void;
  onSearch: () => void;
  user: User | null;
}

export default function Header({ onAddNew, onSearch, user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAuth = () => {
    if (user) {
      signOut(auth);
    } else {
      signInWithGoogle();
    }
    setIsMenuOpen(false);
  };

  const navItems = [
    {
      label: 'Add new card',
      icon: <Plus size={18} />,
      onClick: () => { onAddNew(); setIsMenuOpen(false); },
      show: !!user
    },
    {
      label: 'Search',
      icon: <Search size={18} />,
      onClick: () => { onSearch(); setIsMenuOpen(false); },
      show: true
    },
    {
      label: user ? 'Log out' : 'Login to contribute',
      icon: user ? <LogOut size={18} /> : <LogIn size={18} />,
      onClick: handleAuth,
      show: true
    }
  ];

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-black flex items-center justify-between pl-4 min-[480px]:pl-6 pr-0 z-50 border-b border-white/10">
      <div className="flex items-center space-x-8">
        <div className="text-sm font-semibold tracking-widest text-white uppercase">
          WORDS OF THE PROPHETS
        </div>
      </div>

      <div className="flex items-center space-x-3 min-[480px]:space-x-6 h-full">
        <div className="hidden min-[480px]:flex items-center space-x-6 h-10">
          {user && (
            <>
              <button 
                onClick={onAddNew}
                className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add new card</span>
              </button>
              
              <div className="w-[1px] h-6 bg-[#555555]" aria-hidden="true" />
            </>
          )}

          <button 
            onClick={onSearch}
            className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <Search size={18} />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        <div className="hidden min-[480px]:block w-[1px] h-6 bg-[#555555]" aria-hidden="true" />

        <div className="hidden min-[480px]:block">
          <button 
            onClick={handleAuth}
            className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            {user ? (
              <>
                <span>Log out</span>
                <LogOut size={16} />
              </>
            ) : (
              <>
                <span>Login to contribute</span>
                <LogIn size={16} />
              </>
            )}
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="min-[480px]:hidden p-2 text-gray-300 hover:text-white"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="min-[480px]:hidden absolute top-16 left-0 right-0 bg-[#0a0a0a] border-b border-white/10 py-6 px-4 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.filter(item => item.show).map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex items-center space-x-4 w-full p-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-lg"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
