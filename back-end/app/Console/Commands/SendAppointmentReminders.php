<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;

class SendAppointmentReminders extends Command
{
    /**
     * Le nom et la signature de la commande console.
     *
     * @var string
     */
    protected $signature = 'appointments:send-reminders';

    /**
     * La description de la commande console.
     *
     * @var string
     */
    protected $description = 'Envoie des rappels pour les rendez-vous de demain';

    /**
     * Le service de notification.
     *
     * @var \App\Services\NotificationService
     */
    protected $notificationService;

    /**
     * Créer une nouvelle instance de commande.
     *
     * @param  \App\Services\NotificationService  $notificationService
     * @return void
     */
    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    /**
     * Exécuter la commande console.
     *
     * @return int
     */
    public function handle()
    {
        $tomorrow = Carbon::tomorrow()->toDateString();
        
        $this->info("Recherche des rendez-vous pour le {$tomorrow}...");
        
        // Récupérer tous les rendez-vous confirmés pour demain
        $appointments = Appointment::where('date', $tomorrow)
            ->where('status', 'confirmé')
            ->with('patient', 'doctor')
            ->get();
        
        $this->info("Trouvé {$appointments->count()} rendez-vous pour demain.");
        
        foreach ($appointments as $appointment) {
            $this->info("Envoi d'un rappel à {$appointment->patient->name} pour le rendez-vous de {$appointment->time}");
            
            // Envoyer un rappel au patient
            $this->notificationService->sendAppointmentNotification(
                $appointment->patient,
                [
                    'date' => $appointment->date,
                    'time' => $appointment->time,
                    'doctor' => $appointment->doctor->name
                ],
                'reminder'
            );
        }
        
        $this->info('Rappels de rendez-vous envoyés avec succès!');
        
        return 0;
    }
}