import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ListTodo, PlusCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/tasks', icon: ListTodo, label: 'Tasks' },
    ...(isAdmin ? [{ path: '/add-task', icon: PlusCircle, label: 'Add' }] : []),
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full touch-button",
                "transition-colors duration-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-1 h-1 bg-gradient-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "w-6 h-6 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs mt-1 font-medium transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
