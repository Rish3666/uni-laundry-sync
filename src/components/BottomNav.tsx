import { Home, ShoppingBag, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();

  // Hide nav on auth, qr-scanner, and admin pages
  if (location.pathname === "/auth" || 
      location.pathname === "/qr-scanner" || 
      location.pathname.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/orders", icon: ShoppingBag, label: "Orders" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`transition-transform ${isActive ? "scale-110" : ""}`}>
                <Icon className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
