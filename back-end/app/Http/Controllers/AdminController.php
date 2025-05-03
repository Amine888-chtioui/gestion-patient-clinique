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

class AdminController extends Controller
{
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
        
        // Récupérer tous les médecins
        $doctors = User::where('role', 'doctor')->get();
        
        // Formater les données pour la réponse
        $formattedDoctors = $doctors->map(function ($doctor) {
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
        $appointment = Appointment::findOrFail($id);
        
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
        
        // Recharger les relations pour la réponse
        $appointment->load(['patient:id,name,email', 'doctor:id,name,email']);
        
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
        
        // Trouver le rendez-vous
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
}