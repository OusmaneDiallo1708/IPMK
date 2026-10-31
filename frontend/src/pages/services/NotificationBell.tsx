// components/NotificationBell.tsx
import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, AlertCircle, UserCheck, Package, ShoppingCart } from 'lucide-react';
import { notificationService, Notification } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    // S'abonner aux notifications
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    // Démarrer la vérification périodique
    const interval = notificationService.startPeriodicCheck(user?.role || 'visiteur', 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user?.role]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'info':
        return <Info size={16} className="text-blue-500" />;
      default:
        return <AlertCircle size={16} className="text-red-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    return `Il y a ${days} j`;
  };

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const removeNotification = (id: string) => {
    notificationService.removeNotification(id);
  };

  return (
    <div className="relative">
      {/* Icône de cloche avec badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau des notifications */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-100 animate-slide-down">
            {/* En-tête */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount} non lue(s)
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune notification</p>
                  <p className="text-xs text-gray-400 mt-1">Les alertes apparaîtront ici</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      if (notification.link) {
                        window.location.href = notification.link;
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-sm text-gray-800">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatTime(notification.time)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pied de page */}
            {notifications.length > 0 && (
              <div className="p-2 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => {
                    notificationService.clearAll();
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-xs text-gray-500 hover:text-red-500 transition-colors py-1"
                >
                  Effacer toutes les notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;