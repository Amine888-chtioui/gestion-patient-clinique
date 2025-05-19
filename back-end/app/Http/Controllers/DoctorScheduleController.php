<?php

namespace App\Http\Controllers;

use App\Models\DoctorSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class DoctorScheduleController extends Controller
{
    /**
     * Récupérer tous les horaires d'un médecin
     */
    public function getSchedules()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer les horaires du médecin
        $schedules = $user->schedules()->orderBy('day_of_week')->get();
        
        return response()->json([
            'schedules' => $schedules
        ]);
    }
    
    /**
     * Créer ou mettre à jour un horaire
     */
    public function updateSchedule(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Valider les données de la requête
        $validatedData = $request->validate([
            'schedules' => 'required|array',
            'schedules.*.day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'schedules.*.start_time' => 'required|date_format:H:i',
            'schedules.*.end_time' => 'required|date_format:H:i|after:schedules.*.start_time',
            'schedules.*.is_available' => 'boolean',
        ]);
        
        // Suppression de tous les horaires existants pour ce médecin
        $user->schedules()->delete();
        
        // Création des nouveaux horaires
        $createdSchedules = [];
        foreach ($validatedData['schedules'] as $scheduleData) {
            $schedule = new DoctorSchedule([
                'day_of_week' => $scheduleData['day_of_week'],
                'start_time' => $scheduleData['start_time'],
                'end_time' => $scheduleData['end_time'],
                'is_available' => $scheduleData['is_available'] ?? true,
            ]);
            
            $user->schedules()->save($schedule);
            $createdSchedules[] = $schedule;
        }
        
        return response()->json([
            'message' => 'Horaires mis à jour avec succès',
            'schedules' => $createdSchedules
        ]);
    }
    
    /**
     * Vérifier la disponibilité d'un médecin pour une date spécifique
     */
    public function checkAvailability(Request $request, $doctorId)
    {
        // Valider les données de la requête
        $validatedData = $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);
        
        // Obtenir le jour de la semaine pour la date donnée
        $dayOfWeek = strtolower(date('l', strtotime($validatedData['date'])));
        
        // Récupérer l'horaire du médecin pour ce jour
        $schedule = DoctorSchedule::where('doctor_id', $doctorId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_available', true)
            ->first();
        
        if (!$schedule) {
            return response()->json([
                'available' => false,
                'message' => 'Le médecin n\'est pas disponible à cette date.'
            ]);
        }
        
        // Récupérer les créneaux déjà réservés pour cette date
        $bookedSlots = \App\Models\Appointment::where('doctor_id', $doctorId)
            ->where('date', $validatedData['date'])
            ->where('status', '!=', 'annulé')
            ->pluck('time')
            ->toArray();
        
        // Générer tous les créneaux disponibles
        $availableSlots = [];
        
        // Durée d'un rendez-vous en minutes (à adapter selon les besoins)
        $appointmentDuration = 30;
        
        // Convertir l'heure de début et de fin en minutes depuis minuit
        $startMinutes = $this->timeToMinutes($schedule->start_time);
        $endMinutes = $this->timeToMinutes($schedule->end_time);
        
        // Générer les créneaux
        for ($time = $startMinutes; $time < $endMinutes; $time += $appointmentDuration) {
            $slotTime = $this->minutesToTime($time);
            
            // Vérifier si ce créneau est déjà réservé
            if (!in_array($slotTime, $bookedSlots)) {
                $availableSlots[] = $slotTime;
            }
        }
        
        return response()->json([
            'available' => true,
            'day_schedule' => [
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
            ],
            'available_slots' => $availableSlots,
            'booked_slots' => $bookedSlots
        ]);
    }
    
    /**
     * Convertir une heure au format "HH:MM:SS" en minutes depuis minuit
     */
    private function timeToMinutes($time)
    {
        list($hours, $minutes) = explode(':', $time);
        return $hours * 60 + $minutes;
    }
    
    /**
     * Convertir des minutes depuis minuit en heure au format "HH:MM"
     */
    private function minutesToTime($minutes)
    {
        $hours = floor($minutes / 60);
        $mins = $minutes % 60;
        return sprintf('%02d:%02d', $hours, $mins);
    }

    /**
 * Récupérer les horaires d'un médecin (pour les patients)
 */
public function getDoctorSchedules($doctor_id)
{
    // Vérifier que l'utilisateur spécifié est bien un médecin
    $doctor = User::find($doctor_id);
    if (!$doctor || !$doctor->isDoctor()) {
        return response()->json(['message' => 'Médecin non trouvé'], 404);
    }
    
    // Récupérer les horaires du médecin
    $schedules = DoctorSchedule::where('doctor_id', $doctor_id)
        ->orderBy('day_of_week')
        ->get();
    
    return response()->json([
        'doctor_id' => $doctor_id,
        'doctor_name' => $doctor->name,
        'schedules' => $schedules
    ]);
}
}