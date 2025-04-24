<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Récupérer toutes les notifications de l'utilisateur
     */
    public function getNotifications()
    {
        $user = Auth::user();
        
        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $user->notifications()->unread()->count()
        ]);
    }
    
    /**
     * Récupérer les notifications non lues de l'utilisateur
     */
    public function getUnreadNotifications()
    {
        $user = Auth::user();
        
        $notifications = $user->notifications()
            ->unread()
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $notifications->count()
        ]);
    }
    
    /**
     * Marquer une notification comme lue
     */
    public function markAsRead($id)
    {
        $user = Auth::user();
        
        $notification = $user->notifications()->findOrFail($id);
        $notification->markAsRead();
        
        return response()->json([
            'message' => 'Notification marquée comme lue',
            'unread_count' => $user->notifications()->unread()->count()
        ]);
    }
    
    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead()
    {
        $user = Auth::user();
        
        $user->notifications()->unread()->update(['read_at' => now()]);
        
        return response()->json([
            'message' => 'Toutes les notifications ont été marquées comme lues',
            'unread_count' => 0
        ]);
    }
    
    /**
     * Supprimer une notification
     */
    public function delete($id)
    {
        $user = Auth::user();
        
        $notification = $user->notifications()->findOrFail($id);
        $notification->delete();
        
        return response()->json([
            'message' => 'Notification supprimée',
            'unread_count' => $user->notifications()->unread()->count()
        ]);
    }
    
    /**
     * Supprimer toutes les notifications lues
     */
    public function deleteAllRead()
    {
        $user = Auth::user();
        
        $user->notifications()->whereNotNull('read_at')->delete();
        
        return response()->json([
            'message' => 'Toutes les notifications lues ont été supprimées',
            'unread_count' => $user->notifications()->unread()->count()
        ]);
    }
}