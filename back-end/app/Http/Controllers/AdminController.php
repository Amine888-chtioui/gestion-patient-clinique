<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Appointment;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\PatientProfile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Contact;
use App\Models\DoctorProfile;
use App\Models\Medication;
use App\Services\NotificationService; // AJOUT

class AdminController extends Controller
{
     protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Récupérer les statistiques générales pour le tableau de bord
     */
    public function getStatistics()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer diverses statistiques
        $stats = [
            'total_patients' => User::where('role', 'patient')->count(),
            'total_doctors' => User::where('role', 'doctor')->count(),
            'total_appointments' => Appointment::count(),
            'appointments_today' => Appointment::whereDate('date', today())->count(),
            'pending_appointments' => Appointment::where('status', 'en attente')->count(),
            'confirmed_appointments' => Appointment::where('status', 'confirmé')->count(),
            'canceled_appointments' => Appointment::where('status', 'annulé')->count(),
            'appointments_last_30_days' => Appointment::whereDate('date', '>=', now()->subDays(30))->count(),
            'new_patients_last_30_days' => User::where('role', 'patient')->whereDate('created_at', '>=', now()->subDays(30))->count(),
            'medical_records_count' => MedicalRecord::count(),
            'prescriptions_count' => Prescription::count(),
        ];
        
        // Données pour le graphique des rendez-vous par mois
        $appointmentsByMonth = DB::table('appointments')
            ->selectRaw('MONTH(date) as month, COUNT(*) as count')
            ->whereYear('date', date('Y'))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month')
            ->map(function ($item) {
                return $item->count;
            })
            ->toArray();
        
        // Remplir les mois manquants
        $months = [];
        for ($i = 1; $i <= 12; $i++) {
            $months[$i] = $appointmentsByMonth[$i] ?? 0;
        }
        
        $stats['appointments_by_month'] = $months;
        
        // Données pour le graphique des rendez-vous par statut
        $stats['appointments_by_status'] = [
            'en attente' => $stats['pending_appointments'],
            'confirmé' => $stats['confirmed_appointments'],
            'annulé' => $stats['canceled_appointments'],
        ];
        
        return response()->json($stats);
    }

    /**
     * Récupérer la liste des patients
     */
    public function getPatients()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer tous les patients avec leurs profils
        $patients = User::where('role', 'patient')
            ->with('patientProfile')
            ->get();
        
        // Formater les données pour la réponse
        $formattedPatients = $patients->map(function ($patient) {
            $profile = $patient->patientProfile;
            
            return [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'created_at' => $patient->created_at->format('Y-m-d H:i:s'),
                'phone' => $profile ? $profile->phone : null,
                'date_of_birth' => $profile ? $profile->date_of_birth : null,
                'address' => $profile ? $profile->address : null,
                'blood_type' => $profile ? $profile->blood_type : null,
                'allergies' => $profile && $profile->allergies ? explode(',', $profile->allergies) : [],
                'chronic_diseases' => $profile && $profile->chronic_diseases ? explode(',', $profile->chronic_diseases) : [],
                'emergency_contact' => $profile ? $profile->emergency_contact : null,
            ];
        });
        
        return response()->json([
            'patients' => $formattedPatients
        ]);
    }

    /**
     * Ajouter un nouveau patient
     */
    public function addPatient(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Valider les données
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string',
            'blood_type' => 'nullable|string|max:5',
            'allergies' => 'nullable|array',
            'chronic_diseases' => 'nullable|array',
            'emergency_contact' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Créer le nouvel utilisateur
        $patient = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'patient',
        ]);
        
        // Créer le profil patient
        $patientProfile = new PatientProfile([
            'user_id' => $patient->id,
            'phone' => $request->phone,
            'date_of_birth' => $request->date_of_birth,
            'address' => $request->address,
            'blood_type' => $request->blood_type,
            'allergies' => $request->allergies ? implode(',', $request->allergies) : null,
            'chronic_diseases' => $request->chronic_diseases ? implode(',', $request->chronic_diseases) : null,
            'emergency_contact' => $request->emergency_contact,
        ]);
        
        $patient->patientProfile()->save($patientProfile);
        
        return response()->json([
            'message' => 'Patient créé avec succès',
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'created_at' => $patient->created_at->format('Y-m-d H:i:s'),
                'phone' => $patientProfile->phone,
                'date_of_birth' => $patientProfile->date_of_birth,
                'address' => $patientProfile->address,
                'blood_type' => $patientProfile->blood_type,
                'allergies' => $request->allergies ?? [],
                'chronic_diseases' => $request->chronic_diseases ?? [],
                'emergency_contact' => $patientProfile->emergency_contact,
            ]
        ], 201);
    }

    /**
     * Mettre à jour un patient existant
     */
    public function updatePatient(Request $request, $id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Trouver le patient
        $patient = User::where('id', $id)->where('role', 'patient')->firstOrFail();
        
        // Valider les données
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $patient->id,
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string',
            'blood_type' => 'nullable|string|max:5',
            'allergies' => 'nullable|array',
            'chronic_diseases' => 'nullable|array',
            'emergency_contact' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Mettre à jour l'utilisateur
        if ($request->has('name')) {
            $patient->name = $request->name;
        }
        
        if ($request->has('email')) {
            $patient->email = $request->email;
        }
        
        if ($request->has('password') && $request->password) {
            $patient->password = Hash::make($request->password);
        }
        
        $patient->save();
        
        // Mettre à jour ou créer le profil patient
        $patientProfile = $patient->patientProfile ?? new PatientProfile(['user_id' => $patient->id]);
        
        if ($request->has('phone')) {
            $patientProfile->phone = $request->phone;
        }
        
        if ($request->has('date_of_birth')) {
            $patientProfile->date_of_birth = $request->date_of_birth;
        }
        
        if ($request->has('address')) {
            $patientProfile->address = $request->address;
        }
        
        if ($request->has('blood_type')) {
            $patientProfile->blood_type = $request->blood_type;
        }
        
        if ($request->has('allergies')) {
            $patientProfile->allergies = $request->allergies ? implode(',', $request->allergies) : null;
        }
        
        if ($request->has('chronic_diseases')) {
            $patientProfile->chronic_diseases = $request->chronic_diseases ? implode(',', $request->chronic_diseases) : null;
        }
        
        if ($request->has('emergency_contact')) {
            $patientProfile->emergency_contact = $request->emergency_contact;
        }
        
        $patient->patientProfile()->save($patientProfile);
        
        return response()->json([
            'message' => 'Patient mis à jour avec succès',
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'created_at' => $patient->created_at->format('Y-m-d H:i:s'),
                'phone' => $patientProfile->phone,
                'date_of_birth' => $patientProfile->date_of_birth,
                'address' => $patientProfile->address,
                'blood_type' => $patientProfile->blood_type,
                'allergies' => $patientProfile->allergies ? explode(',', $patientProfile->allergies) : [],
                'chronic_diseases' => $patientProfile->chronic_diseases ? explode(',', $patientProfile->chronic_diseases) : [],
                'emergency_contact' => $patientProfile->emergency_contact,
            ]
        ]);
    }

    /**
     * Supprimer un patient
     */
    public function deletePatient($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Trouver le patient
        $patient = User::where('id', $id)->where('role', 'patient')->firstOrFail();
        
        // Supprimer le profil associé
        if ($patient->patientProfile) {
            $patient->patientProfile->delete();
        }
        
        // Supprimer l'utilisateur
        $patient->delete();
        
        return response()->json([
            'message' => 'Patient supprimé avec succès'
        ]);
    }

    /**
     * Récupérer la liste des médecins
     */
    public function getDoctors()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer tous les médecins avec leurs profils et services
        $doctors = User::where('role', 'doctor')
            ->with(['doctorProfile.service'])
            ->get();
        
        // Formater les données pour la réponse
        $formattedDoctors = $doctors->map(function ($doctor) {
            $profile = $doctor->doctorProfile;
            
            return [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'email' => $doctor->email,
                'created_at' => $doctor->created_at->format('Y-m-d H:i:s'),
                'speciality' => $doctor->speciality ?? null,
                'phone' => $doctor->phone ?? null,
                'bio' => $doctor->bio ?? null,
                'education' => $doctor->education ?? null,
                'experience' => $doctor->experience ?? null,
                'service' => $profile && $profile->service ? [
                    'id' => $profile->service->id,
                    'name' => $profile->service->name,
                    'icon' => $profile->service->icon,
                ] : null,
            ];
        });
        
        return response()->json([
            'doctors' => $formattedDoctors
        ]);
    }
    /**
     * Ajouter un nouveau médecin
     */
    public function addDoctor(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Valider les données
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'speciality' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string',
            'education' => 'nullable|string',
            'experience' => 'nullable|string',
            'service_id' => 'nullable|exists:services,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Créer le nouveau médecin
        $doctor = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'doctor',
            'speciality' => $request->speciality,
            'phone' => $request->phone,
            'bio' => $request->bio,
            'education' => $request->education,
            'experience' => $request->experience,
        ]);

        if ($request->has('service_id')) {
            $doctorProfile = DoctorProfile::firstOrNew(['user_id' => $doctor->id]);
            $doctorProfile->service_id = $request->service_id;
            $doctor->doctorProfile()->save($doctorProfile);
        }

        return response()->json([
            'message' => 'Médecin créé avec succès',
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'email' => $doctor->email,
                'created_at' => $doctor->created_at->format('Y-m-d H:i:s'),
                'speciality' => $doctor->speciality,
                'phone' => $doctor->phone,
                'bio' => $doctor->bio,
                'education' => $doctor->education,
                'experience' => $doctor->experience,
            ]
        ], 201);
    }

    /**
     * Mettre à jour un médecin existant
     */
    public function updateDoctor(Request $request, $id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Trouver le médecin
        $doctor = User::where('id', $id)->where('role', 'doctor')->firstOrFail();
        
        // Valider les données
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $doctor->id,
            'password' => 'nullable|string|min:8',
            'speciality' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string',
            'education' => 'nullable|string',
            'experience' => 'nullable|string',
            'service_id' => 'nullable|exists:services,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Mettre à jour le médecin
        if ($request->has('name')) {
            $doctor->name = $request->name;
        }
        
        if ($request->has('email')) {
            $doctor->email = $request->email;
        }
        
        if ($request->has('password') && $request->password) {
            $doctor->password = Hash::make($request->password);
        }
        
        if ($request->has('speciality')) {
            $doctor->speciality = $request->speciality;
        }
        
        if ($request->has('phone')) {
            $doctor->phone = $request->phone;
        }
        
        if ($request->has('bio')) {
            $doctor->bio = $request->bio;
        }
        
        if ($request->has('education')) {
            $doctor->education = $request->education;
        }
        
        if ($request->has('experience')) {
            $doctor->experience = $request->experience;
        }
        
        $doctor->save();

        if ($request->has('service_id')) {
            $doctorProfile = DoctorProfile::firstOrNew(['user_id' => $doctor->id]);
            $doctorProfile->service_id = $request->service_id;
            $doctor->doctorProfile()->save($doctorProfile);
        }
        
        return response()->json([
            'message' => 'Médecin mis à jour avec succès',
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'email' => $doctor->email,
                'created_at' => $doctor->created_at->format('Y-m-d H:i:s'),
                'speciality' => $doctor->speciality,
                'phone' => $doctor->phone,
                'bio' => $doctor->bio,
                'education' => $doctor->education,
                'experience' => $doctor->experience,
            ]
        ]);
    }

    /**
     * Supprimer un médecin
     */
    public function deleteDoctor($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Trouver le médecin
        $doctor = User::where('id', $id)->where('role', 'doctor')->firstOrFail();
        
        // Supprimer le médecin
        $doctor->delete();
        
        return response()->json([
            'message' => 'Médecin supprimé avec succès'
        ]);
    }

    /**
     * Récupérer la liste des rendez-vous
     */
    public function getAppointments()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer tous les rendez-vous avec les informations du patient et du médecin
        $appointments = Appointment::with(['patient:id,name,email', 'doctor:id,name,email'])
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
                'doctor_id' => $appointment->doctor_id,
                'doctor_name' => $appointment->doctor->name,
                'status' => $appointment->status,
                'reason' => $appointment->reason,
                'notes' => $appointment->notes,
                'created_at' => $appointment->created_at->format('Y-m-d H:i:s'),
            ];
        });
        
        return response()->json([
            'appointments' => $formattedAppointments
        ]);
    }
    /**
 * Récupérer la liste des dossiers médicaux
 */
public function getMedicalRecords()
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un administrateur
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Récupérer tous les dossiers médicaux avec les informations du patient et du médecin
    $medicalRecords = MedicalRecord::with(['patient:id,name,email', 'doctor:id,name,email', 'documents'])
        ->orderBy('date', 'desc')
        ->get();
    
    // Formater les données pour la réponse
    $formattedRecords = $medicalRecords->map(function ($record) {
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
            })->toArray(),
        ];
    });
    
    return response()->json([
        'medicalRecords' => $formattedRecords
    ]);
}

    /**
     * Ajouter un nouveau rendez-vous
     */
     public function addAppointment(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Valider les données
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'doctor_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'time' => 'required|string',
            'reason' => 'nullable|string',
            'status' => 'required|in:en attente,confirmé,annulé',
            'notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Vérifier que les IDs correspondent bien à un patient et un médecin
        $patient = User::find($request->patient_id);
        $doctor = User::find($request->doctor_id);
        
        if (!$patient || $patient->role !== 'patient') {
            return response()->json(['message' => 'Patient non trouvé'], 404);
        }
        
        if (!$doctor || $doctor->role !== 'doctor') {
            return response()->json(['message' => 'Médecin non trouvé'], 404);
        }
        
        // Créer le rendez-vous
        $appointment = Appointment::create([
            'patient_id' => $request->patient_id,
            'doctor_id' => $request->doctor_id,
            'date' => $request->date,
            'time' => $request->time,
            'reason' => $request->reason,
            'status' => $request->status,
            'notes' => $request->notes,
        ]);

        // AJOUT: Notifications après création du rendez-vous
        // Notification au patient
        $this->notificationService->sendNotification(
            $patient,
            'Nouveau rendez-vous programmé',
            "Un rendez-vous a été programmé pour vous le {$appointment->date} à {$appointment->time} avec le Dr {$doctor->name}.",
            'appointment',
            '/patient/dashboard?tab=appointments'
        );

        // Notification au médecin
        $this->notificationService->sendNotification(
            $doctor,
            'Nouveau rendez-vous assigné',
            "Un rendez-vous a été programmé avec {$patient->name} le {$appointment->date} à {$appointment->time}.",
            'appointment',
            '/doctor/dashboard?tab=appointments'
        );
        
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
                'status' => $appointment->status,
                'reason' => $appointment->reason,
                'notes' => $appointment->notes,
                'created_at' => $appointment->created_at->format('Y-m-d H:i:s'),
            ]
        ], 201);
    }

    /**
     * Mettre à jour un rendez-vous existant
     */
     public function updateAppointment(Request $request, $id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Trouver le rendez-vous
        $appointment = Appointment::with(['patient', 'doctor'])->findOrFail($id);
        
        // AJOUT: Sauvegarder les anciennes valeurs pour les notifications
        $oldDate = $appointment->date;
        $oldTime = $appointment->time;
        $oldStatus = $appointment->status;
        $oldPatientId = $appointment->patient_id;
        $oldDoctorId = $appointment->doctor_id;
        
        // Valider les données
        $validator = Validator::make($request->all(), [
            'patient_id' => 'sometimes|required|exists:users,id',
            'doctor_id' => 'sometimes|required|exists:users,id',
            'date' => 'sometimes|required|date',
            'time' => 'sometimes|required|string',
            'reason' => 'nullable|string',
            'status' => 'sometimes|required|in:en attente,confirmé,annulé',
            'notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Mettre à jour les champs du rendez-vous
        if ($request->has('patient_id')) {
            $patient = User::find($request->patient_id);
            if (!$patient || $patient->role !== 'patient') {
                return response()->json(['message' => 'Patient non trouvé'], 404);
            }
            $appointment->patient_id = $request->patient_id;
        }
        
        if ($request->has('doctor_id')) {
            $doctor = User::find($request->doctor_id);
            if (!$doctor || $doctor->role !== 'doctor') {
                return response()->json(['message' => 'Médecin non trouvé'], 404);
            }
            $appointment->doctor_id = $request->doctor_id;
        }
        
        if ($request->has('date')) {
            $appointment->date = $request->date;
        }
        
        if ($request->has('time')) {
            $appointment->time = $request->time;
        }
        
        if ($request->has('reason')) {
            $appointment->reason = $request->reason;
        }
        
        if ($request->has('status')) {
            $appointment->status = $request->status;
        }
        
        if ($request->has('notes')) {
            $appointment->notes = $request->notes;
        }
        
        $appointment->save();
        
        // Recharger les relations pour la réponse et les notifications
        $appointment->load(['patient:id,name,email', 'doctor:id,name,email']);

        // AJOUT: Notifications après modification
        $hasDateTimeChanged = ($oldDate !== $appointment->date) || ($oldTime !== $appointment->time);
        $hasStatusChanged = $oldStatus !== $appointment->status;
        $hasPatientChanged = $oldPatientId !== $appointment->patient_id;
        $hasDoctorChanged = $oldDoctorId !== $appointment->doctor_id;

        // Notification au patient actuel
        if ($hasDateTimeChanged || $hasStatusChanged || $hasDoctorChanged) {
            $message = "Votre rendez-vous a été modifié par l'administration.";
            if ($hasDateTimeChanged) {
                $message = "Votre rendez-vous a été reprogrammé du {$oldDate} à {$oldTime} vers le {$appointment->date} à {$appointment->time}.";
            } elseif ($hasStatusChanged) {
                $message = "Le statut de votre rendez-vous du {$appointment->date} à {$appointment->time} a été modifié : {$appointment->status}.";
            }
            
            $this->notificationService->sendNotification(
                $appointment->patient,
                'Rendez-vous modifié',
                $message,
                'appointment',
                '/patient/dashboard?tab=appointments'
            );
        }

        // Notification au médecin actuel
        if ($hasDateTimeChanged || $hasStatusChanged || $hasPatientChanged) {
            $message = "Un rendez-vous a été modifié par l'administration.";
            if ($hasDateTimeChanged) {
                $message = "Le rendez-vous avec {$appointment->patient->name} a été reprogrammé du {$oldDate} à {$oldTime} vers le {$appointment->date} à {$appointment->time}.";
            } elseif ($hasStatusChanged) {
                $message = "Le statut du rendez-vous avec {$appointment->patient->name} du {$appointment->date} à {$appointment->time} a été modifié : {$appointment->status}.";
            }
            
            $this->notificationService->sendNotification(
                $appointment->doctor,
                'Rendez-vous modifié',
                $message,
                'appointment',
                '/doctor/dashboard?tab=appointments'
            );
        }

        // Notification à l'ancien patient si le patient a changé
        if ($hasPatientChanged) {
            $oldPatient = User::find($oldPatientId);
            if ($oldPatient) {
                $this->notificationService->sendNotification(
                    $oldPatient,
                    'Rendez-vous annulé',
                    "Votre rendez-vous du {$oldDate} à {$oldTime} a été réassigné par l'administration.",
                    'appointment',
                    '/patient/dashboard?tab=appointments'
                );
            }
        }

        // Notification à l'ancien médecin si le médecin a changé
        if ($hasDoctorChanged) {
            $oldDoctor = User::find($oldDoctorId);
            if ($oldDoctor) {
                $this->notificationService->sendNotification(
                    $oldDoctor,
                    'Rendez-vous réassigné',
                    "Le rendez-vous du {$oldDate} à {$oldTime} vous a été retiré par l'administration.",
                    'appointment',
                    '/doctor/dashboard?tab=appointments'
                );
            }
        }
        
        return response()->json([
            'message' => 'Rendez-vous mis à jour avec succès',
            'appointment' => [
                'id' => $appointment->id,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'patient_id' => $appointment->patient_id,
                'patient_name' => $appointment->patient->name,
                'doctor_id' => $appointment->doctor_id,
                'doctor_name' => $appointment->doctor->name,
                'status' => $appointment->status,
                'reason' => $appointment->reason,
                'notes' => $appointment->notes,
                'created_at' => $appointment->created_at->format('Y-m-d H:i:s'),
            ]
        ]);
    }

    /**
     * Supprimer un rendez-vous
     */
    public function deleteAppointment($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Trouver le rendez-vous avec les relations
        $appointment = Appointment::with(['patient', 'doctor'])->findOrFail($id);

        // AJOUT: Sauvegarder les informations pour les notifications
        $patient = $appointment->patient;
        $doctor = $appointment->doctor;
        $appointmentDate = $appointment->date;
        $appointmentTime = $appointment->time;

        // Supprimer le rendez-vous
        $appointment->delete();

        // AJOUT: Notifications après suppression
        // Notification au patient
        $this->notificationService->sendNotification(
            $patient,
            'Rendez-vous annulé',
            "Votre rendez-vous du {$appointmentDate} à {$appointmentTime} avec le Dr {$doctor->name} a été annulé par l'administration.",
            'appointment',
            '/patient/dashboard?tab=appointments'
        );

        // Notification au médecin
        $this->notificationService->sendNotification(
            $doctor,
            'Rendez-vous annulé',
            "Le rendez-vous avec {$patient->name} du {$appointmentDate} à {$appointmentTime} a été annulé par l'administration.",
            'appointment',
            '/doctor/dashboard?tab=appointments'
        );
        
        return response()->json([
            'message' => 'Rendez-vous supprimé avec succès'
        ]);
    }

        public function updateMedicalRecord(Request $request, $id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Trouver le dossier médical avec ses relations
        $medicalRecord = MedicalRecord::with(['patient', 'doctor'])->findOrFail($id);
        
        // Valider les données
        $validator = Validator::make($request->all(), [
            'patient_id' => 'sometimes|required|exists:users,id',
            'doctor_id' => 'sometimes|required|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'date' => 'sometimes|required|date',
            'type' => 'sometimes|required|in:consultation,analyse,chirurgie,autre',
            'diagnosis' => 'sometimes|required|string',
            'notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        // AJOUT: Sauvegarder les anciennes valeurs pour les notifications
        $oldPatientId = $medicalRecord->patient_id;
        $oldDoctorId = $medicalRecord->doctor_id;
        $hasChanged = false;
        
        // Mettre à jour les champs
        if ($request->has('patient_id') && $request->patient_id != $medicalRecord->patient_id) {
            $patient = User::find($request->patient_id);
            if (!$patient || $patient->role !== 'patient') {
                return response()->json(['message' => 'Patient non trouvé'], 404);
            }
            $medicalRecord->patient_id = $request->patient_id;
            $hasChanged = true;
        }
        
        if ($request->has('doctor_id') && $request->doctor_id != $medicalRecord->doctor_id) {
            $doctor = User::find($request->doctor_id);
            if (!$doctor || $doctor->role !== 'doctor') {
                return response()->json(['message' => 'Médecin non trouvé'], 404);
            }
            $medicalRecord->doctor_id = $request->doctor_id;
            $hasChanged = true;
        }
        
        if ($request->has('appointment_id')) {
            $medicalRecord->appointment_id = $request->appointment_id;
            $hasChanged = true;
        }
        
        if ($request->has('date')) {
            $medicalRecord->date = $request->date;
            $hasChanged = true;
        }
        
        if ($request->has('type')) {
            $medicalRecord->type = $request->type;
            $hasChanged = true;
        }
        
        if ($request->has('diagnosis')) {
            $medicalRecord->diagnosis = $request->diagnosis;
            $hasChanged = true;
        }
        
        if ($request->has('notes')) {
            $medicalRecord->notes = $request->notes;
            $hasChanged = true;
        }
        
        $medicalRecord->save();
        
        // Recharger les relations
        $medicalRecord->load(['patient', 'doctor', 'documents']);

        // AJOUT: Notifications après modification
        if ($hasChanged) {
            // Notification au patient actuel
            $this->notificationService->sendNotification(
                $medicalRecord->patient,
                'Dossier médical modifié',
                "Votre dossier médical du {$medicalRecord->date} ({$medicalRecord->type}) a été modifié par l'administration.",
                'medical',
                '/patient/dashboard?tab=medicalRecords'
            );

            // Notification au médecin actuel
            $this->notificationService->sendNotification(
                $medicalRecord->doctor,
                'Dossier médical modifié',
                "Le dossier médical de {$medicalRecord->patient->name} du {$medicalRecord->date} a été modifié par l'administration.",
                'medical',
                '/doctor/dashboard?tab=patients'
            );

            // Si le patient a changé, notifier l'ancien patient
            if ($request->has('patient_id') && $oldPatientId != $medicalRecord->patient_id) {
                $oldPatient = User::find($oldPatientId);
                if ($oldPatient) {
                    $this->notificationService->sendNotification(
                        $oldPatient,
                        'Dossier médical transféré',
                        "Un de vos dossiers médicaux a été transféré vers un autre patient par l'administration.",
                        'medical',
                        '/patient/dashboard?tab=medicalRecords'
                    );
                }
            }

            // Si le médecin a changé, notifier l'ancien médecin
            if ($request->has('doctor_id') && $oldDoctorId != $medicalRecord->doctor_id) {
                $oldDoctor = User::find($oldDoctorId);
                if ($oldDoctor) {
                    $this->notificationService->sendNotification(
                        $oldDoctor,
                        'Dossier médical transféré',
                        "Un dossier médical que vous aviez créé a été transféré vers un autre médecin par l'administration.",
                        'medical',
                        '/doctor/dashboard?tab=patients'
                    );
                }
            }
        }
        
        return response()->json([
            'message' => 'Dossier médical mis à jour avec succès',
            'medicalRecord' => [
                'id' => $medicalRecord->id,
                'date' => $medicalRecord->date,
                'type' => $medicalRecord->type,
                'patient_id' => $medicalRecord->patient_id,
                'patient_name' => $medicalRecord->patient->name,
                'doctor_id' => $medicalRecord->doctor_id,
                'doctor_name' => $medicalRecord->doctor->name,
                'diagnosis' => $medicalRecord->diagnosis,
                'notes' => $modicalRecord->notes,
                'documents' => $medicalRecord->documents->map(function ($document) {
                    return [
                        'id' => $document->id,
                        'name' => $document->name,
                        'type' => $document->type,
                    ];
                })->toArray(),
            ]
        ]);
    }

    /**
     * Récupérer la liste des utilisateurs
     */
    public function getUsers()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer tous les utilisateurs (sauf l'admin connecté)
        $users = User::where('id', '!=', $user->id)->get();
        
        // Formater les données pour la réponse
        $formattedUsers = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at->format('Y-m-d H:i:s'),
            ];
        });
        
        return response()->json([
            'users' => $formattedUsers
        ]);
    }

    /**
     * Ajouter un nouvel utilisateur
     */
    public function addUser(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Valider les données
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,doctor,patient',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Créer le nouvel utilisateur
        $newUser = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);
        
        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => [
                'id' => $newUser->id,
                'name' => $newUser->name,
                'email' => $newUser->email,
                'role' => $newUser->role,
                'created_at' => $newUser->created_at->format('Y-m-d H:i:s'),
            ]
        ], 201);
    }
    /**
 * Get the admin's profile
 */
public function getProfile()
{
    $user = Auth::user();
    
    // Verify the user is an admin
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized access'], 403);
    }
    
    return response()->json([
        'profile' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone ?? null,
            'bio' => $user->bio ?? null,
            'photoUrl' => $user->profile_photo ? asset('uploads/profiles/' . $user->profile_photo) : null,
        ]
    ]);
}

/**
 * Update the admin's profile
 */
public function updateProfile(Request $request)
{
    $user = Auth::user();
    
    // Verify the user is an admin
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized access'], 403);
    }
    
    $validatedData = $request->validate([
        'name' => 'sometimes|required|string|max:255',
        'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
        'password' => 'nullable|string|min:8|confirmed',
        'phone' => 'nullable|string|max:20',
        'bio' => 'nullable|string',
    ]);
    
    // Update user information
    if (isset($validatedData['name'])) {
        $user->name = $validatedData['name'];
    }
    
    if (isset($validatedData['email'])) {
        $user->email = $validatedData['email'];
    }
    
    if (isset($validatedData['password']) && $validatedData['password']) {
        $user->password = Hash::make($validatedData['password']);
    }
    
    if (isset($validatedData['phone'])) {
        $user->phone = $validatedData['phone'];
    }
    
    if (isset($validatedData['bio'])) {
        $user->bio = $validatedData['bio'];
    }
    
    $user->save();
    
    return response()->json([
        'message' => 'Profile updated successfully',
        'profile' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
            'bio' => $user->bio,
            'photoUrl' => $user->profile_photo ? asset('uploads/profiles/' . $user->profile_photo) : null,
        ]
    ]);
}

/**
 * Update the admin's profile photo
 */
public function updateProfilePhoto(Request $request)
{
    $user = Auth::user();
    
    // Verify the user is an admin
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized access'], 403);
    }
    
    // Validate the request
    $request->validate([
        'profile_photo' => 'required|image|mimes:jpeg,png,jpg|max:2048', // 2MB max
    ]);
    
    try {
        Log::info('Admin profile photo upload started');
        
        // Check if an image was sent
        if ($request->hasFile('profile_photo')) {
            $image = $request->file('profile_photo');
            Log::info('Image file received', [
                'original_name' => $image->getClientOriginalName(),
                'size' => $image->getSize(),
                'mime' => $image->getMimeType()
            ]);
            
            // Delete old photo if it exists
            if ($user->profile_photo && file_exists(public_path('uploads/profiles/' . $user->profile_photo))) {
                unlink(public_path('uploads/profiles/' . $user->profile_photo));
                Log::info('Old profile photo deleted');
            }
            
            // Generate a unique name for the image
            $fileName = time() . '.' . $image->getClientOriginalExtension();
            Log::info('Generated filename: ' . $fileName);
            
            // Create directory if it doesn't exist
            $uploadPath = public_path('uploads/profiles');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0777, true);
                Log::info('Created upload directory: ' . $uploadPath);
            }
            
            // Move the uploaded file
            $image->move($uploadPath, $fileName);
            Log::info('Image moved to: ' . $uploadPath . '/' . $fileName);
            
            // Update the photo path in the user model
            $user->profile_photo = $fileName;
            $user->save();
            Log::info('User record updated with new profile photo');
            
            // Generate the public URL of the photo
            $photoUrl = asset('uploads/profiles/' . $fileName);
            
            return response()->json([
                'message' => 'Profile photo updated successfully',
                'photo_url' => $photoUrl
            ]);
        } else {
            Log::warning('No image file was received in the request');
            return response()->json([
                'message' => 'No image was sent',
            ], 400);
        }
    } catch (\Exception $e) {
        Log::error('Error updating admin profile photo: ' . $e->getMessage());
        Log::error($e->getTraceAsString());
        
        return response()->json([
            'message' => 'Error updating profile photo',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Mettre à jour un utilisateur existant
     */
    public function updateUser(Request $request, $id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Trouver l'utilisateur
        $updateUser = User::findOrFail($id);
        
        // Empêcher la modification d'autres comptes admin
        if ($updateUser->role === 'admin' && $updateUser->id !== $user->id) {
            return response()->json([
                'message' => 'Vous ne pouvez pas modifier un autre compte administrateur'
            ], 403);
        }
        
        // Valider les données
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $updateUser->id,
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|required|in:admin,doctor,patient',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Mettre à jour l'utilisateur
        if ($request->has('name')) {
            $updateUser->name = $request->name;
        }
        
        if ($request->has('email')) {
            $updateUser->email = $request->email;
        }
        
        if ($request->has('password') && $request->password) {
            $updateUser->password = Hash::make($request->password);
        }
        
        if ($request->has('role')) {
            $updateUser->role = $request->role;
        }
        
        $updateUser->save();
        
        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => [
                'id' => $updateUser->id,
                'name' => $updateUser->name,
                'email' => $updateUser->email,
                'role' => $updateUser->role,
                'created_at' => $updateUser->created_at->format('Y-m-d H:i:s'),
            ]
        ]);
    }
    public function storeContact(Request $request)
{
    $validatedData = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'message' => 'required|string',
    ]);
    
    $contact = Contact::create($validatedData);
    
    return response()->json([
        'message' => 'Votre message a été envoyé avec succès',
        'contact' => $contact
    ], 201);
}

/**
 * Récupérer tous les messages de contact (admin uniquement)
 */
public function getContacts(Request $request)
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un administrateur
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Filtrer par statut (lu/non lu)
    $query = Contact::query()->orderBy('created_at', 'desc');
    
    if ($request->has('read')) {
        $query->where('read', $request->boolean('read'));
    }
    
    $contacts = $query->get();
    
    return response()->json([
        'contacts' => $contacts,
        'unread_count' => Contact::where('read', false)->count()
    ]);
}

/**
 * Afficher un message de contact spécifique
 */
public function showContact($id)
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un administrateur
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    $contact = Contact::findOrFail($id);
    
    return response()->json([
        'contact' => $contact
    ]);
}

/**
 * Marquer un message comme lu
 */
public function markContactAsRead($id)
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un administrateur
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    $contact = Contact::findOrFail($id);
    $contact->read = true;
    $contact->save();
    
    return response()->json([
        'message' => 'Message marqué comme lu',
        'contact' => $contact
    ]);
}

/**
 * Supprimer un message de contact
 */
public function deleteContact($id)
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un administrateur
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    $contact = Contact::findOrFail($id);
    $contact->delete();
    
    return response()->json([
        'message' => 'Message supprimé avec succès'
    ]);
}

    /**
     * Supprimer un utilisateur
     */
    public function deleteUser($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Empêcher la suppression de soi-même ou d'autres admins
        if ($id == $user->id) {
            return response()->json([
                'message' => 'Vous ne pouvez pas supprimer votre propre compte'
            ], 403);
        }
        
        // Trouver l'utilisateur
        $deleteUser = User::findOrFail($id);
        
        if ($deleteUser->role === 'admin') {
            return response()->json([
                'message' => 'Vous ne pouvez pas supprimer un autre compte administrateur'
            ], 403);
        }
        
        // Supprimer l'utilisateur
        $deleteUser->delete();
        
        return response()->json([
            'message' => 'Utilisateur supprimé avec succès'
        ]);
    }

    /**
 * Récupérer toutes les prescriptions pour l'administration
 */
public function getAdminPrescriptions()
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un administrateur
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Récupérer toutes les prescriptions avec les informations du patient et du médecin
    $prescriptions = Prescription::with(['patient:id,name,email', 'doctor:id,name,email', 'medications'])
        ->orderBy('date', 'desc')
        ->get();
    
    // Formater les données pour la réponse
    $formattedPrescriptions = $prescriptions->map(function ($prescription) {
        return [
            'id' => $prescription->id,
            'date' => $prescription->date,
            'patient_id' => $prescription->patient_id,
            'patient_name' => $prescription->patient->name,
            'doctor_id' => $prescription->doctor_id,
            'doctor_name' => $prescription->doctor->name,
            'notes' => $prescription->notes,
            'medication_count' => $prescription->medications->count(),
            'created_at' => $prescription->created_at->format('Y-m-d H:i:s'),
        ];
    });
    
    return response()->json([
        'prescriptions' => $formattedPrescriptions
    ]);
}

/**
 * Récupérer une prescription spécifique pour l'administration
 */
public function getAdminPrescription($id)
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un administrateur
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Récupérer la prescription avec ses médicaments, patient et médecin
    $prescription = Prescription::with(['patient', 'doctor', 'medications', 'medicalRecord'])
        ->findOrFail($id);
    
    return response()->json([
        'prescription' => $prescription
    ]);
}

/**
 * Créer une nouvelle prescription via l'administration
 */
public function createAdminPrescription(Request $request)
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un administrateur
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Valider les données
    $validator = Validator::make($request->all(), [
        'patient_id' => 'required|exists:users,id',
        'doctor_id' => 'required|exists:users,id',
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
    
    if ($validator->fails()) {
        return response()->json([
            'message' => 'Erreur de validation',
            'errors' => $validator->errors()
        ], 422);
    }
    
    // Vérifier que les IDs correspondent bien à un patient et un médecin
    $patient = User::find($request->patient_id);
    $doctor = User::find($request->doctor_id);
    
    if (!$patient || $patient->role !== 'patient') {
        return response()->json(['message' => 'Patient non trouvé'], 404);
    }
    
    if (!$doctor || $doctor->role !== 'doctor') {
        return response()->json(['message' => 'Médecin non trouvé'], 404);
    }
    
    // Créer la prescription
    $prescription = Prescription::create([
        'patient_id' => $request->patient_id,
        'doctor_id' => $request->doctor_id,
        'medical_record_id' => $request->medical_record_id,
        'date' => $request->date,
        'notes' => $request->notes,
    ]);
    
    // Ajouter les médicaments
    foreach ($request->medications as $medicationData) {
        $prescription->medications()->create([
            'name' => $medicationData['name'],
            'dosage' => $medicationData['dosage'],
            'frequency' => $medicationData['frequency'],
            'duration' => $medicationData['duration'],
            'instructions' => $medicationData['instructions'] ?? null,
        ]);
    }
    
    // Charger les relations pour la réponse
    $prescription->load(['patient', 'doctor', 'medications']);
    
    return response()->json([
        'message' => 'Prescription créée avec succès',
        'prescription' => $prescription
    ], 201);
}

/**
 * Mettre à jour une prescription existante via l'administration
 */
public function editAdminPrescription(Request $request, $id)
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un administrateur
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Trouver la prescription
    $prescription = Prescription::findOrFail($id);
    
    // Valider les données
    $validator = Validator::make($request->all(), [
        'patient_id' => 'sometimes|required|exists:users,id',
        'doctor_id' => 'sometimes|required|exists:users,id',
        'medical_record_id' => 'nullable|exists:medical_records,id',
        'date' => 'sometimes|required|date',
        'notes' => 'nullable|string',
        'medications' => 'sometimes|required|array|min:1',
        'medications.*.id' => 'nullable|exists:medications,id',
        'medications.*.name' => 'required|string',
        'medications.*.dosage' => 'required|string',
        'medications.*.frequency' => 'required|string',
        'medications.*.duration' => 'required|string',
        'medications.*.instructions' => 'nullable|string',
    ]);
    
    if ($validator->fails()) {
        return response()->json([
            'message' => 'Erreur de validation',
            'errors' => $validator->errors()
        ], 422);
    }
    
    // Mettre à jour les champs de la prescription
    if ($request->has('patient_id')) {
        $patient = User::find($request->patient_id);
        if (!$patient || $patient->role !== 'patient') {
            return response()->json(['message' => 'Patient non trouvé'], 404);
        }
        $prescription->patient_id = $request->patient_id;
    }
    
    if ($request->has('doctor_id')) {
        $doctor = User::find($request->doctor_id);
        if (!$doctor || $doctor->role !== 'doctor') {
            return response()->json(['message' => 'Médecin non trouvé'], 404);
        }
        $prescription->doctor_id = $request->doctor_id;
    }
    
    if ($request->has('medical_record_id')) {
        $prescription->medical_record_id = $request->medical_record_id;
    }
    
    if ($request->has('date')) {
        $prescription->date = $request->date;
    }
    
    if ($request->has('notes')) {
        $prescription->notes = $request->notes;
    }
    
    $prescription->save();
    
    // Mettre à jour les médicaments si nécessaire
    if ($request->has('medications')) {
        // Récupérer les IDs des médicaments existants
        $existingMedicationIds = $prescription->medications()->pluck('id')->toArray();
        $updatedMedicationIds = [];
        
        foreach ($request->medications as $medicationData) {
            if (isset($medicationData['id']) && in_array($medicationData['id'], $existingMedicationIds)) {
                // Mettre à jour un médicament existant
                $medication = Medication::find($medicationData['id']);
                $medication->update([
                    'name' => $medicationData['name'],
                    'dosage' => $medicationData['dosage'],
                    'frequency' => $medicationData['frequency'],
                    'duration' => $medicationData['duration'],
                    'instructions' => $medicationData['instructions'] ?? null,
                ]);
                
                $updatedMedicationIds[] = $medication->id;
            } else {
                // Créer un nouveau médicament
                $medication = $prescription->medications()->create([
                    'name' => $medicationData['name'],
                    'dosage' => $medicationData['dosage'],
                    'frequency' => $medicationData['frequency'],
                    'duration' => $medicationData['duration'],
                    'instructions' => $medicationData['instructions'] ?? null,
                ]);
                
                $updatedMedicationIds[] = $medication->id;
            }
        }
        
        // Supprimer les médicaments qui ne sont plus présents
        $medicationsToDelete = array_diff($existingMedicationIds, $updatedMedicationIds);
        if (!empty($medicationsToDelete)) {
            Medication::whereIn('id', $medicationsToDelete)->delete();
        }
    }
    
    // Charger les relations pour la réponse
    $prescription->load(['patient', 'doctor', 'medications']);
    
    return response()->json([
        'message' => 'Prescription mise à jour avec succès',
        'prescription' => $prescription
    ]);
}

/**
 * Supprimer une prescription via l'administration
 */
public function removeAdminPrescription($id)
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un administrateur
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Trouver la prescription
    $prescription = Prescription::findOrFail($id);
    
    // Supprimer tous les médicaments associés
    $prescription->medications()->delete();
    
    // Supprimer la prescription
    $prescription->delete();
    
    return response()->json([
        'message' => 'Prescription supprimée avec succès'
    ]);
}
}