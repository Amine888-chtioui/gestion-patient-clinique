<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

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

    /**
     * Créer manuellement une notification (pour l'admin)
     */
    public function createNotification(Request $request)
    {
        // Vérifier que l'utilisateur est un admin
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|in:info,success,warning,error,appointment,medical,prescription,patient',
            'link' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $notification = Notification::create([
            'user_id' => $request->user_id,
            'title' => $request->title,
            'message' => $request->message,
            'type' => $request->type,
            'link' => $request->link,
        ]);
        
        return response()->json([
            'message' => 'Notification créée avec succès',
            'notification' => $notification
        ], 201);
    }

    /**
     * Envoyer une notification à tous les utilisateurs d'un rôle spécifique
     */
    public function notifyRole(Request $request)
    {
        // Vérifier que l'utilisateur est un admin
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'role' => 'required|string|in:patient,doctor,admin',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|in:info,success,warning,error,appointment,medical,prescription,patient',
            'link' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Récupérer tous les utilisateurs du rôle spécifié
        $users = User::where('role', $request->role)->get();
        
        $count = 0;
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'title' => $request->title,
                'message' => $request->message,
                'type' => $request->type,
                'link' => $request->link,
            ]);
            $count++;
        }
        
        return response()->json([
            'message' => 'Notifications envoyées avec succès',
            'count' => $count
        ]);
    }

    /**
     * Récupérer les dernières notifications pour surveillance admin
     */
    public function getSystemNotifications(Request $request)
    {
        // Vérifier que l'utilisateur est un admin
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer les 50 dernières notifications du système
        $notifications = Notification::with('user:id,name,email,role')
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();
        
        // Statistiques des notifications
        $stats = [
            'total' => Notification::count(),
            'unread' => Notification::whereNull('read_at')->count(),
            'today' => Notification::whereDate('created_at', today())->count(),
            'by_type' => Notification::selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
        ];
        
        return response()->json([
            'notifications' => $notifications,
            'stats' => $stats
        ]);
    }

    /**
     * Récupérer les notifications pour un utilisateur spécifique (admin only)
     */
    public function getUserNotifications($userId)
    {
        // Vérifier que l'utilisateur est un admin
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $user = User::findOrFail($userId);
        
        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role
            ],
            'notifications' => $notifications,
            'unread_count' => $user->notifications()->unread()->count()
        ]);
    }
}