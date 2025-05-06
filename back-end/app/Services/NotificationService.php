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
        $link = '';
        
        // Déterminer le lien en fonction du rôle de l'utilisateur
        if ($user->role === 'patient') {
            $link = '/patient/dashboard?tab=appointments';
        } elseif ($user->role === 'doctor') {
            $link = '/doctor/dashboard?tab=appointments';
        }
        
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
        $link = $user->role === 'patient' 
            ? '/patient/dashboard?tab=medicalRecords' 
            : '/doctor/dashboard?tab=patients';
        
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
        $link = $user->role === 'patient' 
            ? '/patient/dashboard?tab=prescriptions'
            : '/doctor/dashboard?tab=patients';
        
        return $this->sendNotification($user, $title, $message, 'prescription', $link);
    }
    
    /**
     * Envoyer une notification de facture
     *
     * @param User $user
     * @param array $invoiceDetails
     * @param string $action
     * @return Notification
     */
    public function sendInvoiceNotification(User $user, array $invoiceDetails, string $action): Notification
    {
        $title = '';
        $message = '';
        $link = '/patient-invoices/' . $invoiceDetails['id'];
        
        switch ($action) {
            case 'created':
                $title = 'Nouvelle facture';
                $message = "Une nouvelle facture ({$invoiceDetails['number']}) d'un montant de {$invoiceDetails['amount']}€ a été émise.";
                break;
            case 'paid':
                $title = 'Facture payée';
                $message = "Votre paiement pour la facture {$invoiceDetails['number']} a été confirmé.";
                break;
            case 'due_soon':
                $title = 'Échéance de paiement';
                $message = "La facture {$invoiceDetails['number']} arrive à échéance le {$invoiceDetails['due_date']}.";
                break;
            case 'overdue':
                $title = 'Facture en retard';
                $message = "La facture {$invoiceDetails['number']} a dépassé sa date d'échéance du {$invoiceDetails['due_date']}.";
                break;
        }
        
        return $this->sendNotification($user, $title, $message, 'invoice', $link);
    }

    /**
     * Envoyer une notification spécifique au médecin concernant un patient
     *
     * @param User $doctor
     * @param array $patientDetails
     * @param string $action
     * @return Notification
     */
    public function sendDoctorPatientNotification(User $doctor, array $patientDetails, string $action): Notification
    {
        if ($doctor->role !== 'doctor') {
            throw new \InvalidArgumentException("L'utilisateur doit être un médecin");
        }

        $title = '';
        $message = '';
        $link = '/doctor/dashboard?tab=patients';

        switch ($action) {
            case 'new_patient':
                $title = 'Nouveau patient assigné';
                $message = "Un nouveau patient, {$patientDetails['name']}, vous a été assigné.";
                break;
            case 'updated_profile':
                $title = 'Profil patient mis à jour';
                $message = "Le profil du patient {$patientDetails['name']} a été mis à jour.";
                break;
            case 'medical_info':
                $title = 'Informations médicales mises à jour';
                $message = "Des informations médicales importantes ont été ajoutées pour {$patientDetails['name']}.";
                break;
        }

        return $this->sendNotification($doctor, $title, $message, 'patient', $link);
    }

    /**
     * Envoyer une notification concernant des résultats d'analyses
     *
     * @param User $user
     * @param array $testDetails
     * @return Notification
     */
    public function sendTestResultsNotification(User $user, array $testDetails): Notification
    {
        $title = 'Résultats d\'analyses disponibles';
        $message = "Les résultats de vos analyses du {$testDetails['date']} sont disponibles.";
        $link = $user->role === 'patient' 
            ? '/patient/dashboard?tab=medicalRecords' 
            : '/doctor/dashboard?tab=patients';
        $type = $user->role === 'patient' ? 'medical' : 'patient';

        return $this->sendNotification($user, $title, $message, $type, $link);
    }
}