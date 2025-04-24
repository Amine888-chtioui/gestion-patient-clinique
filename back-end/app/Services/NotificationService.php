<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Créer une notification pour un utilisateur
     *
     * @param User $user
     * @param string $title
     * @param string $message
     * @param string $type
     * @param string|null $link
     * @return Notification
     */
    public function sendNotification(User $user, string $title, string $message, string $type = 'info', ?string $link = null): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'link' => $link,
        ]);
    }

    /**
     * Envoyer une notification à plusieurs utilisateurs
     *
     * @param array $userIds
     * @param string $title
     * @param string $message
     * @param string $type
     * @param string|null $link
     * @return array
     */
    public function sendNotificationToMany(array $userIds, string $title, string $message, string $type = 'info', ?string $link = null): array
    {
        $notifications = [];
        
        foreach ($userIds as $userId) {
            $notifications[] = Notification::create([
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'link' => $link,
            ]);
        }
        
        return $notifications;
    }

    /**
     * Envoyer une notification à tous les utilisateurs d'un rôle spécifique
     *
     * @param string $role
     * @param string $title
     * @param string $message
     * @param string $type
     * @param string|null $link
     * @return array
     */
    public function sendNotificationToRole(string $role, string $title, string $message, string $type = 'info', ?string $link = null): array
    {
        $users = User::where('role', $role)->pluck('id')->toArray();
        return $this->sendNotificationToMany($users, $title, $message, $type, $link);
    }

    /**
     * Envoyer une notification à tous les utilisateurs
     *
     * @param string $title
     * @param string $message
     * @param string $type
     * @param string|null $link
     * @return array
     */
    public function sendNotificationToAll(string $title, string $message, string $type = 'info', ?string $link = null): array
    {
        $users = User::pluck('id')->toArray();
        return $this->sendNotificationToMany($users, $title, $message, $type, $link);
    }
    
    /**
     * Envoyer une notification de rendez-vous
     *
     * @param User $user
     * @param array $appointmentDetails
     * @param string $action
     * @return Notification
     */
    public function sendAppointmentNotification(User $user, array $appointmentDetails, string $action): Notification
    {
        $title = '';
        $message = '';
        $link = '/patient/dashboard?tab=appointments';
        
        switch ($action) {
            case 'created':
                $title = 'Nouveau rendez-vous';
                $message = "Votre rendez-vous du {$appointmentDetails['date']} à {$appointmentDetails['time']} a été créé.";
                break;
            case 'confirmed':
                $title = 'Rendez-vous confirmé';
                $message = "Votre rendez-vous du {$appointmentDetails['date']} à {$appointmentDetails['time']} a été confirmé.";
                break;
            case 'cancelled':
                $title = 'Rendez-vous annulé';
                $message = "Votre rendez-vous du {$appointmentDetails['date']} à {$appointmentDetails['time']} a été annulé.";
                break;
            case 'reminder':
                $title = 'Rappel de rendez-vous';
                $message = "Rappel: Vous avez un rendez-vous demain à {$appointmentDetails['time']}.";
                break;
        }
        
        return $this->sendNotification($user, $title, $message, 'appointment', $link);
    }
    
    /**
     * Envoyer une notification de dossier médical
     *
     * @param User $user
     * @param array $recordDetails
     * @return Notification
     */
    public function sendMedicalRecordNotification(User $user, array $recordDetails): Notification
    {
        $title = 'Nouveau dossier médical';
        $message = "Un nouveau dossier médical a été créé suite à votre consultation du {$recordDetails['date']}.";
        $link = '/patient/dashboard?tab=medicalRecords';
        
        return $this->sendNotification($user, $title, $message, 'medical', $link);
    }
    
    /**
     * Envoyer une notification d'ordonnance
     *
     * @param User $user
     * @param array $prescriptionDetails
     * @return Notification
     */
    public function sendPrescriptionNotification(User $user, array $prescriptionDetails): Notification
    {
        $title = 'Nouvelle ordonnance';
        $message = "Une nouvelle ordonnance a été créée pour vous le {$prescriptionDetails['date']}.";
        $link = '/patient/dashboard?tab=prescriptions';
        
        return $this->sendNotification($user, $title, $message, 'prescription', $link);
    }
}