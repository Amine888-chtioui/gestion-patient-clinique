<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // $schedule->command('inspire')->hourly();
        
        // Exécuter la commande de rappel de rendez-vous tous les jours à 9h du matin
        $schedule->command('appointments:send-reminders')->dailyAt('09:00');
        
        // Exécuter la commande de rappel de factures tous les jours à 10h du matin
        $schedule->command('invoices:send-reminders')->dailyAt('10:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}