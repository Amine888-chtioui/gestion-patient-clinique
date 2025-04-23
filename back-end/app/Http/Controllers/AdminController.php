<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Appointment;
use App\Models\MedicalRecord;
use App\Models\PatientProfile;
use App\Models\Document;
use App\Models\Prescription;
use App\Models\Medication;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Afficher les statistiques du tableau de bord d'administration
     */
    public function dashboard()
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Statistiques générales
        $stats = [
            'totalPatients' => User::where('role', 'patient')->count(),
            'totalDoctors' => User::where('role', 'doctor')->count(),
            'totalRecords' => MedicalRecord::count(),
            'appointmentsToday' => Appointment::whereDate('date', Carbon::today())->count(),
        ];
        
        // Rendez-vous récents
        $recentAppointments = Appointment::with(['patient:id,name', 'doctor:id,name'])
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->take(5)
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'date' => $appointment->date,
                    'time' => $appointment->time,
                    'patient_name' => $appointment->patient->name,
                    'doctor_name' => $appointment->doctor->name,
                    'status' => $appointment->status,
                ];
            });
            
        $stats['recentAppointments'] = $recentAppointments;
        
        // Statistiques clés
        $today = Carbon::today();
        $lastMonth = Carbon::today()->subMonth();
        
        // Taux d'occupation (ratio de rendez-vous confirmés sur la capacité totale)
        $totalAppointmentsCapacity = 100; // À ajuster selon votre logique métier
        $confirmedAppointments = Appointment::where('status', 'confirmé')
            ->whereMonth('date', $today->month)
            ->whereYear('date', $today->year)
            ->count();
            
        $occupancyRate = round(($confirmedAppointments / $totalAppointmentsCapacity) * 100);
        
        // Rendez-vous hebdomadaires
        $weeklyAppointments = Appointment::whereBetween('date', [
                Carbon::today()->startOfWeek(),
                Carbon::today()->endOfWeek()
            ])->count();
        
        // Nouveaux patients ce mois-ci
        $newPatientsThisMonth = User::where('role', 'patient')
            ->whereMonth('created_at', $today->month)
            ->whereYear('created_at', $today->year)
            ->count();
            
        // Spécialité la plus demandée
        // Note: Dans une implémentation réelle, vous auriez une table de spécialités
        $topSpecialty = "Médecine Générale"; // Exemple fixe
        
        $stats['keyStats'] = [
            'occupancyRate' => $occupancyRate,
            'weeklyAppointments' => $weeklyAppointments,
            'newPatientsThisMonth' => $newPatientsThisMonth,
            'topSpecialty' => $topSpecialty,
        ];
        
        // Rendez-vous par date (pour le graphique)
        $appointmentsByDate = Appointment::select(DB::raw('date, COUNT(*) as count'))
            ->whereMonth('date', $today->month)
            ->whereYear('date', $today->year)
            ->groupBy('date')
            ->orderBy('date')
            ->get();
            
        $stats['appointmentsByDate'] = $appointmentsByDate;
        
        // Patients par médecin (pour le graphique)
        $patientsByDoctor = User::where('role', 'doctor')
            ->withCount(['doctorAppointments as appointments_count'])
            ->get()
            ->map(function ($doctor) {
                return [
                    'doctor_name' => $doctor->name,
                    'patients_count' => $doctor->appointments_count,
                ];
            });
            
        $stats['patientsByDoctor'] = $patientsByDoctor;
        
        // Rendez-vous par statut (pour le graphique)
        $appointmentsByStatus = Appointment::select('status', DB::raw('count(*) as value'))
            ->whereMonth('date', $today->month)
            ->whereYear('date', $today->year)
            ->groupBy('status')
            ->get();
            
        $stats['appointmentsByStatus'] = $appointmentsByStatus;
        
        // Données supplémentaires pour les recommandations
        $stats['conversionRate'] = 75; // Exemple fixe
        $stats['averageWaitTime'] = '7 jours'; // Exemple fixe
        $stats['leastActiveDay'] = 'Lundi'; // Exemple fixe
        $stats['peakTime'] = '15h00'; // Exemple fixe
        
        return response()->json($stats);
    }

    /**
     * Récupérer la liste des patients
     */
    public function getPatients()
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer tous les patients avec leurs profils
        $patients = User::where('role', 'patient')
            ->with('patientProfile')
            ->get()
            ->map(function ($patient) {
                $profile = $patient->patientProfile;
                
                // Récupérer le dernier rendez-vous du patient
                $lastAppointment = Appointment::where('patient_id', $patient->id)
                    ->orderBy('date', 'desc')
                    ->orderBy('time', 'desc')
                    ->first();
                    
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
                    'last_appointment' => $lastAppointment ? $lastAppointment->date : null,
                    'created_at' => $patient->created_at ? $patient->created_at->format('Y-m-d') : null,
                ];
            });
            
        return response()->json([
            'patients' => $patients
        ]);
    }

    /**
     * Ajouter un nouveau patient
     */
    public function addPatient(Request $request)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Valider les données de base de l'utilisateur
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'blood_type' => 'nullable|string|max:10',
            'allergies' => 'nullable|array',
            'chronic_diseases' => 'nullable|array',
            'emergency_contact' => 'nullable|string|max:255',
            'medical_history' => 'nullable|string',
        ]);
        
        // Créer l'utilisateur avec le rôle patient
        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'role' => 'patient',
        ]);
        
        // Préparer les données du profil
        $profileData = [
            'user_id' => $user->id,
            'phone' => $validatedData['phone'] ?? null,
            'address' => $validatedData['address'] ?? null,
            'date_of_birth' => $validatedData['date_of_birth'] ?? null,
            'blood_type' => $validatedData['blood_type'] ?? null,
            'allergies' => isset($validatedData['allergies']) ? implode(',', $validatedData['allergies']) : null,
            'chronic_diseases' => isset($validatedData['chronic_diseases']) ? implode(',', $validatedData['chronic_diseases']) : null,
            'emergency_contact' => $validatedData['emergency_contact'] ?? null,
            'medical_history' => $validatedData['medical_history'] ?? null,
        ];
        
        // Créer le profil patient
        $profile = PatientProfile::create($profileData);
        
        // Préparer la réponse
        $patientData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $profile->phone,
            'date_of_birth' => $profile->date_of_birth,
            'address' => $profile->address,
            'blood_type' => $profile->blood_type,
            'allergies' => $profile->allergies ? explode(',', $profile->allergies) : [],
            'chronic_diseases' => $profile->chronic_diseases ? explode(',', $profile->chronic_diseases) : [],
            'emergency_contact' => $profile->emergency_contact,
            'medical_history' => $profile->medical_history,
            'created_at' => $user->created_at->format('Y-m-d'),
        ];
        
        return response()->json([
            'message' => 'Patient créé avec succès',
            'patient' => $patientData
        ], 201);
    }

    /**
     * Mettre à jour un patient existant
     */
    public function updatePatient(Request $request, $id)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer l'utilisateur patient
        $user = User::where('id', $id)
            ->where('role', 'patient')
            ->firstOrFail();
            
        // Valider les données
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'blood_type' => 'nullable|string|max:10',
            'allergies' => 'nullable|array',
            'chronic_diseases' => 'nullable|array',
            'emergency_contact' => 'nullable|string|max:255',
            'medical_history' => 'nullable|string',
        ]);
        
        // Mettre à jour les informations de base de l'utilisateur
        if (isset($validatedData['name'])) {
            $user->name = $validatedData['name'];
        }
        
        if (isset($validatedData['email'])) {
            $user->email = $validatedData['email'];
        }
        
        if (isset($validatedData['password']) && $validatedData['password']) {
            $user->password = Hash::make($validatedData['password']);
        }
        
        $user->save();
        
        // Récupérer ou créer le profil patient
        $profile = $user->patientProfile ?? new PatientProfile(['user_id' => $user->id]);
        
        // Mettre à jour les champs du profil
        if (isset($validatedData['phone'])) {
            $profile->phone = $validatedData['phone'];
        }
        
        if (isset($validatedData['address'])) {
            $profile->address = $validatedData['address'];
        }
        
        if (isset($validatedData['date_of_birth'])) {
            $profile->date_of_birth = $validatedData['date_of_birth'];
        }
        
        if (isset($validatedData['blood_type'])) {
            $profile->blood_type = $validatedData['blood_type'];
        }
        
        if (isset($validatedData['allergies'])) {
            $profile->allergies = implode(',', $validatedData['allergies']);
        }
        
        if (isset($validatedData['chronic_diseases'])) {
            $profile->chronic_diseases = implode(',', $validatedData['chronic_diseases']);
        }
        
        if (isset($validatedData['emergency_contact'])) {
            $profile->emergency_contact = $validatedData['emergency_contact'];
        }
        
        if (isset($validatedData['medical_history'])) {
            $profile->medical_history = $validatedData['medical_history'];
        }
        
        // Sauvegarder le profil
        $user->patientProfile()->save($profile);
        
        // Préparer la réponse
        $patientData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $profile->phone,
            'date_of_birth' => $profile->date_of_birth,
            'address' => $profile->address,
            'blood_type' => $profile->blood_type,
            'allergies' => $profile->allergies ? explode(',', $profile->allergies) : [],
            'chronic_diseases' => $profile->chronic_diseases ? explode(',', $profile->chronic_diseases) : [],
            'emergency_contact' => $profile->emergency_contact,
            'medical_history' => $profile->medical_history,
            'created_at' => $user->created_at->format('Y-m-d'),
        ];
        
        return response()->json([
            'message' => 'Patient mis à jour avec succès',
            'patient' => $patientData
        ]);
    }

    /**
     * Supprimer un patient
     */
    public function deletePatient($id)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer l'utilisateur patient
        $user = User::where('id', $id)
            ->where('role', 'patient')
            ->firstOrFail();
            
        // Supprimer le profil patient s'il existe
        if ($user->patientProfile) {
            $user->patientProfile->delete();
        }
        
        // Supprimer l'utilisateur
        $user->delete();
        
        return response()->json([
            'message' => 'Patient supprimé avec succès'
        ]);
    }

    /**
     * Récupérer la liste des médecins
     */
    public function getDoctors()
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer tous les médecins
        $doctors = User::where('role', 'doctor')
            ->get()
            ->map(function ($doctor) {
                // Compter le nombre de patients uniques pour ce médecin
                $patientsCount = Appointment::where('doctor_id', $doctor->id)
                    ->distinct('patient_id')
                    ->count('patient_id');
                    
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                    'specialty' => $doctor->specialty ?? null,
                    'phone' => $doctor->phone ?? null,
                    'bio' => $doctor->bio ?? null,
                    'education' => $doctor->education ?? null,
                    'experience' => $doctor->experience ?? null,
                    'patients_count' => $patientsCount,
                    'created_at' => $doctor->created_at ? $doctor->created_at->format('Y-m-d') : null,
                ];
            });
            
        return response()->json([
            'doctors' => $doctors
        ]);
    }

    /**
     * Ajouter un nouveau médecin
     */
    public function addDoctor(Request $request)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Valider les données
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'specialty' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string',
            'education' => 'nullable|string',
            'experience' => 'nullable|string',
        ]);
        
        // Créer l'utilisateur avec le rôle médecin
        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'role' => 'doctor',
            'specialty' => $validatedData['specialty'] ?? null,
            'phone' => $validatedData['phone'] ?? null,
            'bio' => $validatedData['bio'] ?? null,
            'education' => $validatedData['education'] ?? null,
            'experience' => $validatedData['experience'] ?? null,
        ]);
        
        return response()->json([
            'message' => 'Médecin créé avec succès',
            'doctor' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'specialty' => $user->specialty,
                'phone' => $user->phone,
                'bio' => $user->bio,
                'education' => $user->education,
                'experience' => $user->experience,
                'created_at' => $user->created_at->format('Y-m-d'),
            ]
        ], 201);
    }

    /**
     * Mettre à jour un médecin existant
     */
    public function updateDoctor(Request $request, $id)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer l'utilisateur médecin
        $user = User::where('id', $id)
            ->where('role', 'doctor')
            ->firstOrFail();
            
        // Valider les données
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'specialty' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string',
            'education' => 'nullable|string',
            'experience' => 'nullable|string',
        ]);
        
        // Mettre à jour les informations
        if (isset($validatedData['name'])) {
            $user->name = $validatedData['name'];
        }
        
        if (isset($validatedData['email'])) {
            $user->email = $validatedData['email'];
        }
        
        if (isset($validatedData['password']) && $validatedData['password']) {
            $user->password = Hash::make($validatedData['password']);
        }
        
        if (isset($validatedData['specialty'])) {
            $user->specialty = $validatedData['specialty'];
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
            'message' => 'Médecin mis à jour avec succès',
            'doctor' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'specialty' => $user->specialty,
                'phone' => $user->phone,
                'bio' => $user->bio,
                'education' => $user->education,
                'experience' => $user->experience,
                'created_at' => $user->created_at->format('Y-m-d'),
            ]
        ]);
    }

    /**
     * Supprimer un médecin
     */
    public function deleteDoctor($id)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer l'utilisateur médecin
        $user = User::where('id', $id)
            ->where('role', 'doctor')
            ->firstOrFail();
            
        // Supprimer le médecin
        $user->delete();
        
        return response()->json([
            'message' => 'Médecin supprimé avec succès'
        ]);
    }

    /**
     * Récupérer la liste des rendez-vous
     */
    public function getAppointments()
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer tous les rendez-vous avec les informations du patient et du médecin
        $appointments = Appointment::with(['patient:id,name,email', 'doctor:id,name,specialty'])
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'date' => $appointment->date,
                    'time' => $appointment->time,
                    'patient_id' => $appointment->patient_id,
                    'patient_name' => $appointment->patient->name,
                    'doctor_id' => $appointment->doctor_id,
                    'doctor_name' => $appointment->doctor->name,
                    'doctor_specialty' => $appointment->doctor->specialty,
                    'status' => $appointment->status,
                    'reason' => $appointment->reason,
                    'notes' => $appointment->notes,
                ];
            });
            
        return response()->json([
            'appointments' => $appointments
        ]);
    }

    /**
     * Ajouter un nouveau rendez-vous
     */
    public function addAppointment(Request $request)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Valider les données
        $validatedData = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'doctor_id' => 'required|exists:users,id',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required',
            'reason' => 'nullable|string|max:500',
            'status' => 'required|in:confirmé,en attente,annulé',
            'notes' => 'nullable|string',
        ]);
        
        // Vérifier que le patient a bien le rôle patient
        $patient = User::find($validatedData['patient_id']);
        if (!$patient || $patient->role !== 'patient') {
            return response()->json(['message' => 'Le patient spécifié n\'existe pas'], 404);
        }
        
        // Vérifier que le médecin a bien le rôle médecin
        $doctor = User::find($validatedData['doctor_id']);
        if (!$doctor || $doctor->role !== 'doctor') {
            return response()->json(['message' => 'Le médecin spécifié n\'existe pas'], 404);
        }
        
        // Vérifier si le médecin a déjà un rendez-vous à cette date et heure
        $existingAppointment = Appointment::where('doctor_id', $validatedData['doctor_id'])
            ->where('date', $validatedData['date'])
            ->where('time', $validatedData['time'])
            ->where('status', '!=', 'annulé')
            ->first();
            
        if ($existingAppointment) {
            return response()->json([
                'message' => 'Ce créneau horaire n\'est pas disponible. Veuillez choisir une autre date ou heure.'
            ], 422);
        }
        
        // Créer le rendez-vous
        $appointment = Appointment::create([
            'patient_id' => $validatedData['patient_id'],
            'doctor_id' => $validatedData['doctor_id'],
            'date' => $validatedData['date'],
            'time' => $validatedData['time'],
            'reason' => $validatedData['reason'] ?? null,
            'status' => $validatedData['status'],
            'notes' => $validatedData['notes'] ?? null,
        ]);
        
        return response()->json([
            'message' => 'Rendez-vous créé avec succès',
            'appointment' => [
                'id' => $appointment->id,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'patient_id' => $appointment->patient_id,
                'patient_name' => $patient->name,
                'doctor_id' => $appointment->doctor_id,
                'doctor_name' => $doctor->name,
                'doctor_specialty' => $doctor->specialty,
                'status' => $appointment->status,
                'reason' => $appointment->reason,
                'notes' => $appointment->notes,
            ]
        ], 201);
    }

    /**
     * Mettre à jour un rendez-vous existant
     */
    public function updateAppointment(Request $request, $id)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer le rendez-vous
        $appointment = Appointment::findOrFail($id);
        
        // Valider les données
        $validatedData = $request->validate([
            'patient_id' => 'sometimes|required|exists:users,id',
            'doctor_id' => 'sometimes|required|exists:users,id',
            'date' => 'sometimes|required|date',
            'time' => 'sometimes|required',
            'reason' => 'nullable|string|max:500',
            'status' => 'sometimes|required|in:confirmé,en attente,annulé',
            'notes' => 'nullable|string',
        ]);
        
        // Si le patient_id change, vérifier que le nouvel utilisateur a bien le rôle patient
        if (isset($validatedData['patient_id']) && $validatedData['patient_id'] !== $appointment->patient_id) {
            $patient = User::find($validatedData['patient_id']);
            if (!$patient || $patient->role !== 'patient') {
                return response()->json(['message' => 'Le patient spécifié n\'existe pas'], 404);
            }
        }
        
        // Si le doctor_id change, vérifier que le nouvel utilisateur a bien le rôle médecin
        if (isset($validatedData['doctor_id']) && $validatedData['doctor_id'] !== $appointment->doctor_id) {
            $doctor = User::find($validatedData['doctor_id']);
            if (!$doctor || $doctor->role !== 'doctor') {
                return response()->json(['message' => 'Le médecin spécifié n\'existe pas'], 404);
            }
        }
        
        // Si la date ou l'heure change, vérifier la disponibilité
        if ((isset($validatedData['date']) && $validatedData['date'] !== $appointment->date) ||
            (isset($validatedData['time']) && $validatedData['time'] !== $appointment->time) ||
            (isset($validatedData['doctor_id']) && $validatedData['doctor_id'] !== $appointment->doctor_id)) {
            
            $doctorId = $validatedData['doctor_id'] ?? $appointment->doctor_id;
            $date = $validatedData['date'] ?? $appointment->date;
            $time = $validatedData['time'] ?? $appointment->time;
            
            // Vérifier si le médecin a déjà un rendez-vous à cette date et heure
            $existingAppointment = Appointment::where('doctor_id', $doctorId)
                ->where('date', $date)
                ->where('time', $time)
                ->where('status', '!=', 'annulé')
                ->where('id', '!=', $id) // Exclure le rendez-vous actuel
                ->first();
                
            if ($existingAppointment) {
                return response()->json([
                    'message' => 'Ce créneau horaire n\'est pas disponible. Veuillez choisir une autre date ou heure.'
                ], 422);
            }
        }
        
        // Mettre à jour les champs du rendez-vous
        if (isset($validatedData['patient_id'])) {
            $appointment->patient_id = $validatedData['patient_id'];
        }
        
        if (isset($validatedData['doctor_id'])) {
            $appointment->doctor_id = $validatedData['doctor_id'];
        }
        
        if (isset($validatedData['date'])) {
            $appointment->date = $validatedData['date'];
        }
        
        if (isset($validatedData['time'])) {
            $appointment->time = $validatedData['time'];
        }
        
        if (isset($validatedData['reason'])) {
            $appointment->reason = $validatedData['reason'];
        }
        
        if (isset($validatedData['status'])) {
            $appointment->status = $validatedData['status'];
        }
        
        if (isset($validatedData['notes'])) {
            $appointment->notes = $validatedData['notes'];
        }
        
        $appointment->save();
        
        // Récupérer les informations du patient et du médecin
        $patient = User::find($appointment->patient_id);
        $doctor = User::find($appointment->doctor_id);
        
        return response()->json([
            'message' => 'Rendez-vous mis à jour avec succès',
            'appointment' => [
                'id' => $appointment->id,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'patient_id' => $appointment->patient_id,
                'patient_name' => $patient->name,
                'doctor_id' => $appointment->doctor_id,
                'doctor_name' => $doctor->name,
                'doctor_specialty' => $doctor->specialty,
                'status' => $appointment->status,
                'reason' => $appointment->reason,
                'notes' => $appointment->notes,
            ]
        ]);
    }

    /**
     * Supprimer un rendez-vous
     */
    public function deleteAppointment($id)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer le rendez-vous
        $appointment = Appointment::findOrFail($id);
        
        // Supprimer le rendez-vous
        $appointment->delete();
        
        return response()->json([
            'message' => 'Rendez-vous supprimé avec succès'
        ]);
    }

    /**
     * Récupérer la liste des utilisateurs
     */
    public function getUsers()
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer tous les utilisateurs
        $users = User::all()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at ? $user->created_at->format('Y-m-d') : null,
                    'email_verified_at' => $user->email_verified_at ? true : false,
                ];
            });
            
        return response()->json([
            'users' => $users
        ]);
    }

    /**
     * Ajouter un nouvel utilisateur
     */
    public function addUser(Request $request)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Valider les données
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,doctor,patient',
        ]);
        
        // Créer l'utilisateur
        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'role' => $validatedData['role'],
        ]);
        
        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at->format('Y-m-d'),
            ]
        ], 201);
    }

    /**
     * Mettre à jour un utilisateur existant
     */
    public function updateUser(Request $request, $id)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer l'utilisateur
        $user = User::findOrFail($id);
        
        // Valider les données
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|required|in:admin,doctor,patient',
        ]);
        
        // Empêcher la modification du rôle si c'est le seul admin
        if (isset($validatedData['role']) && $user->role === 'admin' && $validatedData['role'] !== 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Impossible de changer le rôle du dernier administrateur'
                ], 422);
            }
        }
        
        // Mettre à jour les informations
        if (isset($validatedData['name'])) {
            $user->name = $validatedData['name'];
        }
        
        if (isset($validatedData['email'])) {
            $user->email = $validatedData['email'];
        }
        
        if (isset($validatedData['password']) && $validatedData['password']) {
            $user->password = Hash::make($validatedData['password']);
        }
        
        if (isset($validatedData['role'])) {
            $user->role = $validatedData['role'];
        }
        
        $user->save();
        
        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at->format('Y-m-d'),
            ]
        ]);
    }

    /**
     * Supprimer un utilisateur
     */
    public function deleteUser($id)
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer l'utilisateur
        $user = User::findOrFail($id);
        
        // Empêcher la suppression du dernier admin
        if ($user->role === 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Impossible de supprimer le dernier administrateur'
                ], 422);
            }
        }
        
        // Supprimer le profil patient s'il existe
        if ($user->role === 'patient' && $user->patientProfile) {
            $user->patientProfile->delete();
        }
        
        // Supprimer l'utilisateur
        $user->delete();
        
        return response()->json([
            'message' => 'Utilisateur supprimé avec succès'
        ]);
    }

    /**
     * Récupérer les dossiers médicaux
     */
    public function getMedicalRecords()
    {
        // Vérifier que l'utilisateur est un administrateur
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer tous les dossiers médicaux avec les informations du patient et du médecin
        $medicalRecords = MedicalRecord::with(['patient:id,name', 'doctor:id,name', 'documents'])
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'date' => $record->date,
                    'type' => $record->type,
                    'patient_id' => $record->patient_id,
                    'patient_name' => $record->patient->name,
                    'doctor_id' => $record->doctor_id,
                    'doctor_name' => $record->doctor->name,
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
            
        return response()->json([
            'medicalRecords' => $medicalRecords
        ]);
    }
}