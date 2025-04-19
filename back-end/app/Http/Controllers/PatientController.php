<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Appointment;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\PatientProfile;
use App\Models\Medication;
use App\Models\Document;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PatientController extends Controller
{
    /**
     * Récupérer les rendez-vous du patient
     */
    public function getAppointments()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer les rendez-vous du patient avec les informations du médecin
        $appointments = $user->patientAppointments()
            ->with('doctor:id,name')
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();
        
        // Formater les données pour la réponse
        $formattedAppointments = $appointments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'doctor' => $appointment->doctor->name,
                'specialty' => 'À implémenter', // Vous pouvez ajouter un champ specialty dans la table users ou créer une table doctors
                'status' => $appointment->status,
                'reason' => $appointment->reason,
            ];
        });
        
        return response()->json([
            'appointments' => $formattedAppointments
        ]);
    }

    /**
     * Créer un nouveau rendez-vous
     */
    public function createAppointment(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validatedData = $request->validate([
            'date' => 'required|date|after:today',
            'time' => 'required',
            'doctor_id' => 'required|exists:users,id',
            'reason' => 'required|string|max:500',
        ]);
        
        // Vérifier que le médecin existe et a le rôle de médecin
        $doctor = User::find($validatedData['doctor_id']);
        if (!$doctor || !$doctor->isDoctor()) {
            return response()->json(['message' => 'Médecin non trouvé'], 404);
        }
        
        // Créer le rendez-vous
        $appointment = new Appointment([
            'patient_id' => $user->id,
            'doctor_id' => $validatedData['doctor_id'],
            'date' => $validatedData['date'],
            'time' => $validatedData['time'],
            'reason' => $validatedData['reason'],
            'status' => 'en attente',
        ]);
        
        $appointment->save();
        
        return response()->json([
            'message' => 'Rendez-vous créé avec succès',
            'appointment' => [
                'id' => $appointment->id,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'doctor' => $doctor->name,
                'specialty' => 'À implémenter',
                'status' => $appointment->status,
            ]
        ], 201);
    }

    /**
     * Récupérer le dossier médical du patient
     */
    public function getMedicalRecords()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer les dossiers médicaux du patient avec les informations du médecin et les documents
        $medicalRecords = $user->patientMedicalRecords()
            ->with(['doctor:id,name', 'documents'])
            ->orderBy('date', 'desc')
            ->get();
        
        // Formater les données pour la réponse
        $formattedRecords = $medicalRecords->map(function ($record) {
            return [
                'id' => $record->id,
                'date' => $record->date,
                'type' => $record->type,
                'doctor' => $record->doctor->name,
                'diagnosis' => $record->diagnosis,
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
     * Récupérer les ordonnances du patient
     */
    public function getPrescriptions()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer les ordonnances du patient avec les informations du médecin et les médicaments
        $prescriptions = $user->patientPrescriptions()
            ->with(['doctor:id,name', 'medications'])
            ->orderBy('date', 'desc')
            ->get();
        
        // Formater les données pour la réponse
        $formattedPrescriptions = $prescriptions->map(function ($prescription) {
            return [
                'id' => $prescription->id,
                'date' => $prescription->date,
                'doctor' => $prescription->doctor->name,
                'medications' => $prescription->medications->map(function ($medication) {
                    return [
                        'name' => $medication->name,
                        'dosage' => $medication->dosage,
                        'frequency' => $medication->frequency,
                        'duration' => $medication->duration,
                        'instructions' => $medication->instructions,
                    ];
                })->toArray(),
            ];
        });
        
        return response()->json([
            'prescriptions' => $formattedPrescriptions
        ]);
    }

    /**
     * Récupérer le profil du patient
     */
    public function getProfile()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer le profil du patient, ou créer un profil vide s'il n'existe pas
        $profile = $user->patientProfile ?? new PatientProfile(['user_id' => $user->id]);
        
        // Formater les données pour la réponse
        $formattedProfile = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $profile->phone,
            'address' => $profile->address,
            'dateOfBirth' => $profile->date_of_birth,
            'bloodType' => $profile->blood_type,
            'allergies' => $profile->allergies ? explode(',', $profile->allergies) : [],
            'chronicDiseases' => $profile->chronic_diseases ? explode(',', $profile->chronic_diseases) : [],
            'emergencyContact' => $profile->emergency_contact,
            'medicalHistory' => $profile->medical_history,
        ];
        
        return response()->json([
            'profile' => $formattedProfile
        ]);
    }

    /**
     * Mettre à jour le profil du patient
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'dateOfBirth' => 'nullable|date',
            'bloodType' => 'nullable|string|max:10',
            'allergies' => 'nullable|array',
            'chronicDiseases' => 'nullable|array',
            'emergencyContact' => 'nullable|string|max:255',
            'medicalHistory' => 'nullable|string',
        ]);
        
        // Mise à jour des informations de base de l'utilisateur
        if (isset($validatedData['name'])) {
            $user->name = $validatedData['name'];
        }
        
        if (isset($validatedData['email'])) {
            $user->email = $validatedData['email'];
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
        
        if (isset($validatedData['dateOfBirth'])) {
            $profile->date_of_birth = $validatedData['dateOfBirth'];
        }
        
        if (isset($validatedData['bloodType'])) {
            $profile->blood_type = $validatedData['bloodType'];
        }
        
        if (isset($validatedData['allergies'])) {
            $profile->allergies = implode(',', $validatedData['allergies']);
        }
        
        if (isset($validatedData['chronicDiseases'])) {
            $profile->chronic_diseases = implode(',', $validatedData['chronicDiseases']);
        }
        
        if (isset($validatedData['emergencyContact'])) {
            $profile->emergency_contact = $validatedData['emergencyContact'];
        }
        
        if (isset($validatedData['medicalHistory'])) {
            $profile->medical_history = $validatedData['medicalHistory'];
        }
        
        // Sauvegarder le profil
        $user->patientProfile()->save($profile);
        
        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $profile->phone,
                'address' => $profile->address,
                'dateOfBirth' => $profile->date_of_birth,
                'bloodType' => $profile->blood_type,
                'allergies' => $profile->allergies ? explode(',', $profile->allergies) : [],
                'chronicDiseases' => $profile->chronic_diseases ? explode(',', $profile->chronic_diseases) : [],
                'emergencyContact' => $profile->emergency_contact,
                'medicalHistory' => $profile->medical_history,
            ]
        ]);
    }
    
    /**
     * Télécharger un document
     */
    public function downloadDocument($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer le document
        $document = Document::with('medicalRecord')->findOrFail($id);
        
        // Vérifier que le document appartient au patient
        if ($document->medicalRecord->patient_id !== $user->id) {
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
     * Annuler un rendez-vous
     */
    public function cancelAppointment($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer le rendez-vous
        $appointment = Appointment::where('id', $id)
            ->where('patient_id', $user->id)
            ->first();
        
        if (!$appointment) {
            return response()->json(['message' => 'Rendez-vous non trouvé'], 404);
        }
        
        // Vérifier que le rendez-vous n'est pas déjà annulé
        if ($appointment->status === 'annulé') {
            return response()->json(['message' => 'Ce rendez-vous est déjà annulé'], 400);
        }
        
        // Vérifier que le rendez-vous n'est pas déjà passé
        if ($appointment->date < now()->toDateString() || 
            ($appointment->date == now()->toDateString() && $appointment->time < now()->toTimeString())) {
            return response()->json(['message' => 'Impossible d\'annuler un rendez-vous passé'], 400);
        }
        
        // Annuler le rendez-vous
        $appointment->status = 'annulé';
        $appointment->save();
        
        return response()->json([
            'message' => 'Rendez-vous annulé avec succès',
            'appointment' => [
                'id' => $appointment->id,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'status' => $appointment->status,
            ]
        ]);
    }
}