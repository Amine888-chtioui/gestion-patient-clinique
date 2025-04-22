<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Appointment;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\Medication;
use App\Models\Document;
use App\Models\PatientProfile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Exception;

class DoctorController extends Controller
{
    /**
     * Récupérer les rendez-vous du médecin
     */
    public function getAppointments()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer les rendez-vous du médecin avec les informations du patient
        $appointments = $user->doctorAppointments()
            ->with('patient:id,name,email')
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();
        
        // Formater les données pour la réponse
        $formattedAppointments = $appointments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'patient_id' => $appointment->patient_id,
                'patient_name' => $appointment->patient->name,
                'status' => $appointment->status,
                'reason' => $appointment->reason,
                'notes' => $appointment->notes,
            ];
        });
        
        return response()->json([
            'appointments' => $formattedAppointments
        ]);
    }

    /**
     * Mettre à jour le statut d'un rendez-vous
     */
    public function updateAppointmentStatus(Request $request, $id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validatedData = $request->validate([
            'status' => 'required|in:confirmé,en attente,annulé',
            'notes' => 'nullable|string',
        ]);
        
        // Récupérer le rendez-vous
        $appointment = Appointment::where('id', $id)
            ->where('doctor_id', $user->id)
            ->firstOrFail();
        
        // Mettre à jour le statut et les notes
        $appointment->status = $validatedData['status'];
        
        if (isset($validatedData['notes'])) {
            $appointment->notes = $validatedData['notes'];
        }
        
        $appointment->save();
        
        return response()->json([
            'message' => 'Statut du rendez-vous mis à jour avec succès',
            'appointment' => [
                'id' => $appointment->id,
                'status' => $appointment->status,
                'notes' => $appointment->notes,
            ]
        ]);
    }

    /**
     * Récupérer la liste des patients du médecin
     */
    public function getPatients()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer tous les patients qui ont eu un rendez-vous avec ce médecin
        $patientIds = $user->doctorAppointments()
            ->pluck('patient_id')
            ->unique();
        
        // Récupérer les informations détaillées de ces patients
        $patients = User::whereIn('id', $patientIds)
            ->where('role', 'patient')
            ->with('patientProfile')
            ->get();
        
        // Récupérer le dernier rendez-vous pour chaque patient
        $lastAppointments = [];
        foreach ($patientIds as $patientId) {
            $lastAppointment = Appointment::where('doctor_id', $user->id)
                ->where('patient_id', $patientId)
                ->orderBy('date', 'desc')
                ->orderBy('time', 'desc')
                ->first();
            
            if ($lastAppointment) {
                $lastAppointments[$patientId] = $lastAppointment->date;
            }
        }
        
        // Formater les données pour la réponse
        $formattedPatients = $patients->map(function ($patient) use ($lastAppointments) {
            $profile = $patient->patientProfile;
            
            return [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'phone' => $profile ? $profile->phone : null,
                'date_of_birth' => $profile ? $profile->date_of_birth : null,
                'address' => $profile ? $profile->address : null,
                'blood_type' => $profile ? $profile->blood_type : null,
                'allergies' => $profile && $profile->allergies ? explode(',', $profile->allergies) : [],
                'chronic_diseases' => $profile && $profile->chronic_diseases ? explode(',', $profile->chronic_diseases) : [],
                'emergency_contact' => $profile ? $profile->emergency_contact : null,
                'medical_history' => $profile ? $profile->medical_history : null,
                'last_appointment' => isset($lastAppointments[$patient->id]) ? $lastAppointments[$patient->id] : null,
            ];
        });
        
        return response()->json([
            'patients' => $formattedPatients
        ]);
    }

    /**
     * Récupérer les détails d'un patient spécifique
     */
    public function getPatientDetails($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Vérifier que le médecin a déjà vu ce patient
        $hasAppointment = Appointment::where('doctor_id', $user->id)
            ->where('patient_id', $id)
            ->exists();
        
        if (!$hasAppointment) {
            return response()->json(['message' => 'Vous n\'êtes pas autorisé à accéder aux informations de ce patient'], 403);
        }
        
        // Récupérer le patient avec son profil
        $patient = User::where('id', $id)
            ->where('role', 'patient')
            ->with('patientProfile')
            ->firstOrFail();
        
        // Récupérer les rendez-vous du patient avec ce médecin
        $appointments = Appointment::where('doctor_id', $user->id)
            ->where('patient_id', $id)
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'date' => $appointment->date,
                    'time' => $appointment->time,
                    'status' => $appointment->status,
                    'reason' => $appointment->reason,
                    'notes' => $appointment->notes,
                ];
            });
        
        // Récupérer les dossiers médicaux du patient créés par ce médecin
        $medicalRecords = MedicalRecord::where('doctor_id', $user->id)
            ->where('patient_id', $id)
            ->with('documents')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($record) use ($user) {
                return [
                    'id' => $record->id,
                    'date' => $record->date,
                    'type' => $record->type,
                    'doctor_name' => $user->name,
                    'diagnosis' => $record->diagnosis,
                    'notes' => $record->notes,
                    'documents' => $record->documents->map(function ($document) {
                        return [
                            'id' => $document->id,
                            'name' => $document->name,
                            'type' => $document->type,
                        ];
                    }),
                ];
            });
        
        // Récupérer les ordonnances du patient créées par ce médecin
        $prescriptions = Prescription::where('doctor_id', $user->id)
            ->where('patient_id', $id)
            ->with('medications')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($prescription) use ($user) {
                return [
                    'id' => $prescription->id,
                    'date' => $prescription->date,
                    'doctor_name' => $user->name,
                    'notes' => $prescription->notes,
                    'medications' => $prescription->medications->map(function ($medication) {
                        return [
                            'name' => $medication->name,
                            'dosage' => $medication->dosage,
                            'frequency' => $medication->frequency,
                            'duration' => $medication->duration,
                            'instructions' => $medication->instructions,
                        ];
                    }),
                ];
            });
        
        // Formater les données du patient
        $profile = $patient->patientProfile;
        $patientData = [
            'id' => $patient->id,
            'name' => $patient->name,
            'email' => $patient->email,
            'phone' => $profile ? $profile->phone : null,
            'date_of_birth' => $profile ? $profile->date_of_birth : null,
            'address' => $profile ? $profile->address : null,
            'blood_type' => $profile ? $profile->blood_type : null,
            'allergies' => $profile && $profile->allergies ? explode(',', $profile->allergies) : [],
            'chronic_diseases' => $profile && $profile->chronic_diseases ? explode(',', $profile->chronic_diseases) : [],
            'emergency_contact' => $profile ? $profile->emergency_contact : null,
            'medical_history' => $profile ? $profile->medical_history : null,
            'appointments' => $appointments,
            'medical_records' => $medicalRecords,
            'prescriptions' => $prescriptions,
        ];
        
        return response()->json([
            'patient' => $patientData
        ]);
    }

    /**
     * Créer un nouveau dossier médical
     */
    public function createMedicalRecord(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validatedData = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'date' => 'required|date',
            'type' => 'required|in:consultation,analyse,chirurgie,suivi,autre',
            'diagnosis' => 'required|string',
            'notes' => 'nullable|string',
            'documents' => 'nullable|array',
            'documents.*.name' => 'required|string',
            'documents.*.type' => 'required|string',
        ]);
        
        // Vérifier que le médecin a déjà vu ce patient
        $hasAppointment = Appointment::where('doctor_id', $user->id)
            ->where('patient_id', $validatedData['patient_id'])
            ->exists();
        
        if (!$hasAppointment) {
            return response()->json(['message' => 'Vous n\'êtes pas autorisé à créer un dossier médical pour ce patient'], 403);
        }
        
        // Si appointment_id est fourni, vérifier qu'il appartient bien à ce médecin et patient
        if (isset($validatedData['appointment_id'])) {
            $appointment = Appointment::where('id', $validatedData['appointment_id'])
                ->where('doctor_id', $user->id)
                ->where('patient_id', $validatedData['patient_id'])
                ->first();
            
            if (!$appointment) {
                return response()->json(['message' => 'Ce rendez-vous n\'existe pas ou ne vous appartient pas'], 404);
            }
        }
        
        // Créer le dossier médical
        $medicalRecord = new MedicalRecord([
            'patient_id' => $validatedData['patient_id'],
            'doctor_id' => $user->id,
            'appointment_id' => $validatedData['appointment_id'] ?? null,
            'date' => $validatedData['date'],
            'type' => $validatedData['type'],
            'diagnosis' => $validatedData['diagnosis'],
            'notes' => $validatedData['notes'] ?? null,
        ]);
        
        $medicalRecord->save();
        
        // Traiter les documents si présents
        // Note: Dans une implémentation réelle, il faudrait gérer l'upload des fichiers
        if (isset($validatedData['documents']) && is_array($validatedData['documents'])) {
            foreach ($validatedData['documents'] as $docData) {
                $document = new Document([
                    'medical_record_id' => $medicalRecord->id,
                    'name' => $docData['name'],
                    'file_path' => 'placeholder/path/' . $docData['name'], // Dans une implémentation réelle, ce serait le chemin du fichier uploadé
                    'type' => $docData['type'],
                ]);
                
                $document->save();
            }
        }
        
        // Si le rendez-vous est spécifié, mettre à jour son statut
        if (isset($validatedData['appointment_id'])) {
            $appointment = Appointment::find($validatedData['appointment_id']);
            $appointment->status = 'confirmé';
            $appointment->save();
        }
        
        return response()->json([
            'message' => 'Dossier médical créé avec succès',
            'medical_record' => [
                'id' => $medicalRecord->id,
                'date' => $medicalRecord->date,
                'type' => $medicalRecord->type,
                'diagnosis' => $medicalRecord->diagnosis,
            ]
        ], 201);
    }

    /**
     * Créer une nouvelle ordonnance
     */
    public function createPrescription(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validatedData = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'medical_record_id' => 'nullable|exists:medical_records,id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'medications' => 'required|array|min:1',
            'medications.*.name' => 'required|string',
            'medications.*.dosage' => 'required|string',
            'medications.*.frequency' => 'required|string',
            'medications.*.duration' => 'required|string',
            'medications.*.instructions' => 'nullable|string',
        ]);
        
        // Vérifier que le médecin a déjà vu ce patient
        $hasAppointment = Appointment::where('doctor_id', $user->id)
            ->where('patient_id', $validatedData['patient_id'])
            ->exists();
        
        if (!$hasAppointment) {
            return response()->json(['message' => 'Vous n\'êtes pas autorisé à créer une ordonnance pour ce patient'], 403);
        }
        
        // Si medical_record_id est fourni, vérifier qu'il appartient bien à ce médecin et patient
        if (isset($validatedData['medical_record_id'])) {
            $medicalRecord = MedicalRecord::where('id', $validatedData['medical_record_id'])
                ->where('doctor_id', $user->id)
                ->where('patient_id', $validatedData['patient_id'])
                ->first();
            
            if (!$medicalRecord) {
                return response()->json(['message' => 'Ce dossier médical n\'existe pas ou ne vous appartient pas'], 404);
            }
        }
        
        // Créer l'ordonnance
        $prescription = new Prescription([
            'patient_id' => $validatedData['patient_id'],
            'doctor_id' => $user->id,
            'medical_record_id' => $validatedData['medical_record_id'] ?? null,
            'date' => $validatedData['date'],
            'notes' => $validatedData['notes'] ?? null,
        ]);
        
        $prescription->save();
        
        // Créer les médicaments associés
        foreach ($validatedData['medications'] as $medData) {
            $medication = new Medication([
                'prescription_id' => $prescription->id,
                'name' => $medData['name'],
                'dosage' => $medData['dosage'],
                'frequency' => $medData['frequency'],
                'duration' => $medData['duration'],
                'instructions' => $medData['instructions'] ?? null,
            ]);
            
            $medication->save();
        }
        
        return response()->json([
            'message' => 'Ordonnance créée avec succès',
            'prescription' => [
                'id' => $prescription->id,
                'date' => $prescription->date,
                'medications_count' => count($validatedData['medications']),
            ]
        ], 201);
    }

    /**
     * Télécharger un document
     */
    public function downloadDocument($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer le document
        $document = Document::with('medicalRecord')->findOrFail($id);
        
        // Vérifier que le document a été créé par ce médecin
        if ($document->medicalRecord->doctor_id !== $user->id) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Vérifier que le fichier existe
        if (!Storage::exists($document->file_path)) {
            return response()->json(['message' => 'Fichier non trouvé'], 404);
        }
        
        // Retourner le fichier
        return Storage::download($document->file_path, $document->name);
    }

    /**
     * Récupérer ou mettre à jour le profil du médecin
     */
    public function getProfile()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Dans un système réel, vous auriez une table dédiée pour les profils de médecin
        // Ici, nous utilisons simplement les données de l'utilisateur
        
        return response()->json([
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                // Ces champs seraient idéalement dans une table DoctorProfile
                'speciality' => $user->speciality ?? null,
                'phone' => $user->phone ?? null,
                'bio' => $user->bio ?? null,
                'education' => $user->education ?? null,
                'experience' => $user->experience ?? null,
            ]
        ]);
    }

    /**
     * Mettre à jour le profil du médecin
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'speciality' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string',
            'education' => 'nullable|string',
            'experience' => 'nullable|string',
        ]);
        
        // Mise à jour des informations de base de l'utilisateur
        if (isset($validatedData['name'])) {
            $user->name = $validatedData['name'];
        }
        
        if (isset($validatedData['email'])) {
            $user->email = $validatedData['email'];
        }
        
        // Dans un système réel, ces champs seraient dans une table dédiée aux profils de médecin
        // Ici, nous les ajoutons directement à l'utilisateur (vous devriez adapter votre modèle User)
        
        if (isset($validatedData['speciality'])) {
            $user->speciality = $validatedData['speciality'];
        }
        
        if (isset($validatedData['phone'])) {
            $user->phone = $validatedData['phone'];
        }
        
        if (isset($validatedData['bio'])) {
            $user->bio = $validatedData['bio'];
        }
        
        if (isset($validatedData['education'])) {
            $user->education = $validatedData['education'];
        }
        
        if (isset($validatedData['experience'])) {
            $user->experience = $validatedData['experience'];
        }
        
        $user->save();
        
        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'speciality' => $user->speciality ?? null,
                'phone' => $user->phone ?? null,
                'bio' => $user->bio ?? null,
                'education' => $user->education ?? null,
                'experience' => $user->experience ?? null,
            ]
        ]);
    }

    /**
     * Récupérer les disponibilités d'un médecin pour une date donnée
     * 
     * @param Request $request
     * @param int $doctor_id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAvailability(Request $request, $doctor_id)
    {
        \Log::info('Requête reçue pour getAvailability', [
            'doctor_id' => $doctor_id,
            'params' => $request->all(),
            'route_parameters' => $request->route()->parameters(),
        ]);
        
        // Valider les paramètres de la requête
        $validatedData = $request->validate([
            'date' => 'required|date',
        ]);
        
        // Vérifier que l'utilisateur spécifié est bien un médecin
        $doctor = User::find($doctor_id);
        if (!$doctor || !$doctor->isDoctor()) {
            return response()->json(['message' => 'Médecin non trouvé'], 404);
        }
        
        // Définir les plages horaires générales de disponibilité (8h à 18h)
        $startHour = 8;
        $endHour = 18;
        
        // Définir la durée d'un rendez-vous en minutes (30 minutes par défaut)
        $appointmentDuration = 30;
        
        // Préparer les créneaux disponibles (format 24h)
        $allTimeSlots = [];
        for ($hour = $startHour; $hour < $endHour; $hour++) {
            $allTimeSlots[] = sprintf('%02d:00', $hour);
            $allTimeSlots[] = sprintf('%02d:30', $hour);
        }
        
        // Récupérer les rendez-vous existants pour ce médecin à cette date
        $existingAppointments = Appointment::where('doctor_id', $doctor_id)
            ->where('date', $validatedData['date'])
            ->where('status', '!=', 'annulé')  // Ignorer les rendez-vous annulés
            ->pluck('time')
            ->toArray();
        
        // Déterminer les créneaux disponibles et indisponibles
        $availability = [];
        
        foreach ($allTimeSlots as $timeSlot) {
            // Convertir en objet DateTime pour comparer facilement
            $slotTime = \DateTime::createFromFormat('H:i', $timeSlot);
            
            // Vérifier si ce créneau est déjà pris
            $isBooked = in_array($timeSlot, $existingAppointments);
            
            // Vérifier si ce créneau est dans le passé pour la date d'aujourd'hui
            $isPast = false;
            if ($validatedData['date'] === date('Y-m-d')) {
                $currentTime = new \DateTime();
                $isPast = $slotTime <= $currentTime;
            }
            
            // Déterminer la disponibilité finale
            $status = 'available';
            if ($isBooked) {
                $status = 'booked';
            } elseif ($isPast) {
                $status = 'past';
            }
            
            $availability[] = [
                'time' => $timeSlot,
                'status' => $status
            ];
        }
        
        // Retourner les résultats
        return response()->json([
            'doctor_id' => $doctor_id,
            'doctor_name' => $doctor->name,
            'date' => $validatedData['date'],
            'time_slots' => $availability
        ]);
    }

    /**
     * Récupérer les dates avec des rendez-vous pour un médecin dans un mois donné
     * 
     * @param Request $request
     * @param int $doctor_id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMonthlyAvailability(Request $request, $doctor_id)
    {
        \Log::info('Requête reçue pour getMonthlyAvailability', [
            'doctor_id' => $doctor_id,
            'params' => $request->all(),
            'route_parameters' => $request->route()->parameters(),
        ]);
        
        // Valider les paramètres de la requête
        $validatedData = $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2023',
        ]);
        
        // Vérifier que l'utilisateur spécifié est bien un médecin
        $doctor = User::find($doctor_id);
        if (!$doctor || !$doctor->isDoctor()) {
            return response()->json(['message' => 'Médecin non trouvé'], 404);
        }
        
        // Définir le premier et dernier jour du mois
        $startDate = sprintf('%d-%02d-01', $validatedData['year'], $validatedData['month']);
        $lastDay = date('t', strtotime($startDate)); // Nombre de jours dans le mois
        $endDate = sprintf('%d-%02d-%d', $validatedData['year'], $validatedData['month'], $lastDay);
        
        // Récupérer les rendez-vous pour ce médecin dans ce mois
        $appointments = Appointment::where('doctor_id', $doctor_id)
            ->whereBetween('date', [$startDate, $endDate])
            ->where('status', '!=', 'annulé')
            ->select('date')
            ->get()
            ->groupBy('date');
        
        // Créer un tableau avec le nombre de rendez-vous par date
        $dateAvailability = [];
        $currentDate = new \DateTime($startDate);
        $endDateTime = new \DateTime($endDate);
        
        while ($currentDate <= $endDateTime) {
            $dateStr = $currentDate->format('Y-m-d');
            $count = isset($appointments[$dateStr]) ? count($appointments[$dateStr]) : 0;
            
            // Calculer la disponibilité (20 créneaux disponibles par jour par défaut)
            $maxSlots = 20;
            $availabilityStatus = 'available';
            
            if ($count >= $maxSlots) {
                $availabilityStatus = 'full';
            } elseif ($count > 0) {
                $availabilityStatus = 'partial';
            }
            
            // Vérifier si la date est dans le passé
            $isPast = $currentDate < new \DateTime(date('Y-m-d'));
            if ($isPast) {
                $availabilityStatus = 'past';
            }
            
            $dateAvailability[] = [
                'date' => $dateStr,
                'day' => (int)$currentDate->format('d'),
                'status' => $availabilityStatus,
                'appointments_count' => $count
            ];
            
            $currentDate->modify('+1 day');
        }
        
        // Retourner les résultats
        return response()->json([
            'doctor_id' => $doctor_id,
            'doctor_name' => $doctor->name,
            'year' => $validatedData['year'],
            'month' => $validatedData['month'],
            'dates' => $dateAvailability
        ]);
    }
}