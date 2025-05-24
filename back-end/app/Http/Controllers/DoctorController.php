<?php

namespace App\Http\Controllers;

use App\Models\Invoice; // Ajout de cette ligne
use App\Models\User;
use App\Models\Appointment;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\Medication;
use App\Models\Document;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Hash;
use App\Models\DoctorProfile;
use App\Models\Service;
use Illuminate\Http\Request;
use App\Models\DoctorSchedule;

class DoctorController extends Controller
{
    /**
     * Le service de notification.
     *
     * @var \App\Services\NotificationService
     */
    protected $notificationService;

    /**
     * Créer une nouvelle instance du contrôleur.
     *
     * @param  \App\Services\NotificationService  $notificationService
     * @return void
     */
    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

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
            ->with('patient') // Charger les informations du patient
            ->firstOrFail();
        
        // Mémoriser l'ancien statut pour les notifications
        $oldStatus = $appointment->status;
        
        // Mettre à jour le statut et les notes
        $appointment->status = $validatedData['status'];
        
        if (isset($validatedData['notes'])) {
            $appointment->notes = $validatedData['notes'];
        }
        
        $appointment->save();
        
        // Envoyer une notification au patient UNIQUEMENT lorsque le statut devient "confirmé"
        if ($validatedData['status'] === 'confirmé' && $oldStatus !== 'confirmé') {
            $this->notificationService->sendAppointmentNotification(
                $appointment->patient,
                [
                    'date' => $appointment->date,
                    'time' => $appointment->time,
                    'doctor' => $user->name
                ],
                'confirmed'
            );
        } 
        // Aussi notifier si le rendez-vous est annulé
        else if ($validatedData['status'] === 'annulé' && $oldStatus !== 'annulé') {
            $this->notificationService->sendAppointmentNotification(
                $appointment->patient,
                [
                    'date' => $appointment->date,
                    'time' => $appointment->time,
                    'doctor' => $user->name
                ],
                'cancelled'
            );
        }
        
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
 * Récupérer la liste des médecins disponibles
 */
public function getAllDoctors()
{
    // Récupérer tous les utilisateurs avec le rôle de médecin
    $doctors = User::where('role', 'doctor')
        ->select('id', 'name', 'email')
        ->get();
    
    return response()->json($doctors);
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
    /**
 * Récupérer les détails d'un patient spécifique avec relations
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
    
    // Récupérer les rendez-vous avec leurs relations
    $appointments = Appointment::where('doctor_id', $user->id)
        ->where('patient_id', $id)
        ->with([
            'medicalRecord' => function($query) {
                $query->select('id', 'appointment_id', 'diagnosis', 'type', 'notes');
            },
            'medicalRecord.documents' => function($query) {
                $query->select('id', 'medical_record_id', 'name', 'type');
            }
        ])
        ->orderBy('date', 'desc')
        ->orderBy('time', 'desc')
        ->get()
        ->map(function ($appointment) use ($user) {
            // Récupérer les ordonnances liées à ce rendez-vous
            $prescriptions = [];
            if ($appointment->medicalRecord) {
                $prescriptions = Prescription::where('medical_record_id', $appointment->medicalRecord->id)
                    ->with('medications')
                    ->get()
                    ->map(function ($prescription) {
                        return [
                            'id' => $prescription->id,
                            'date' => $prescription->date,
                            'notes' => $prescription->notes,
                            'medications_count' => $prescription->medications->count(),
                            'medications' => $prescription->medications->map(function ($med) {
                                return [
                                    'name' => $med->name,
                                    'dosage' => $med->dosage,
                                    'frequency' => $med->frequency,
                                    'duration' => $med->duration,
                                ];
                            }),
                        ];
                    });
            }
            
            return [
                'id' => $appointment->id,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'status' => $appointment->status,
                'reason' => $appointment->reason,
                'notes' => $appointment->notes,
                'medical_record' => $appointment->medicalRecord ? [
                    'id' => $appointment->medicalRecord->id,
                    'diagnosis' => $appointment->medicalRecord->diagnosis,
                    'type' => $appointment->medicalRecord->type,
                    'notes' => $appointment->medicalRecord->notes,
                    'documents' => $appointment->medicalRecord->documents->map(function ($doc) {
                        return [
                            'id' => $doc->id,
                            'name' => $doc->name,
                            'type' => $doc->type,
                        ];
                    }),
                ] : null,
                'prescriptions' => $prescriptions,
                'has_medical_record' => $appointment->medicalRecord !== null,
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
                'appointment_id' => $record->appointment_id,
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
        ->with(['medications', 'medicalRecord'])
        ->orderBy('date', 'desc')
        ->get()
        ->map(function ($prescription) use ($user) {
            return [
                'id' => $prescription->id,
                'date' => $prescription->date,
                'doctor_name' => $user->name,
                'notes' => $prescription->notes,
                'medical_record_id' => $prescription->medical_record_id,
                'medical_record' => $prescription->medicalRecord ? [
                    'id' => $prescription->medicalRecord->id,
                    'diagnosis' => $prescription->medicalRecord->diagnosis,
                    'type' => $prescription->medicalRecord->type,
                ] : null,
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

   // Dans la méthode getProfile du DoctorController
public function getProfile()
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un médecin
    if (!$user->isDoctor()) {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Récupérer les détails du médecin
    $doctorProfile = DoctorProfile::where('user_id', $user->id)->first();
    
    // Récupérer les informations du service si disponibles
    $service = null;
    if ($doctorProfile && $doctorProfile->service_id) {
        $service = Service::find($doctorProfile->service_id);
    }
    
    return response()->json([
        'profile' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $doctorProfile ? $doctorProfile->phone : null,
            'speciality' => $doctorProfile ? $doctorProfile->specialite : null,
            'education' => $doctorProfile ? $doctorProfile->education : null,
            'address' => $doctorProfile ? $doctorProfile->adresse : null,
            'bio' => $doctorProfile ? $doctorProfile->bio : null,
            'experience' => $doctorProfile ? $doctorProfile->experience : null,
            'photoUrl' => $user->profile_photo ? asset('uploads/profiles/' . $user->profile_photo) : null,
            'service' => $service ? [
                'id' => $service->id,
                'name' => $service->name,
                'icon' => $service->icon,
            ] : null,
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
            'password' => 'nullable|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'speciality' => 'nullable|string|max:255',
            'education' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
            'experience' => 'nullable|string',
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
        
        // Mettre à jour ou créer les détails du médecin
        $doctorProfile = DoctorProfile::firstOrNew(['user_id' => $user->id]);
        
        if (isset($validatedData['phone'])) {
            $doctorProfile->phone = $validatedData['phone'];
        }
        
        if (isset($validatedData['speciality'])) {
            $doctorProfile->specialite = $validatedData['speciality'];
        }
        
        if (isset($validatedData['education'])) {
            $doctorProfile->education = $validatedData['education'];
        }
        
        if (isset($validatedData['address'])) {
            $doctorProfile->adresse = $validatedData['address'];
        }
        
        if (isset($validatedData['bio'])) {
            $doctorProfile->bio = $validatedData['bio'];
        }
        
        if (isset($validatedData['experience'])) {
            $doctorProfile->experience = $validatedData['experience'];
        }
        
        $doctorProfile->save();
        
        // Retourner le profil mis à jour
        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $doctorProfile->phone ?? null,
                'speciality' => $doctorProfile->specialite ?? null,
                'education' => $doctorProfile->education ?? null,
                'address' => $doctorProfile->adresse ?? null,
                'bio' => $doctorProfile->bio ?? null,
                'experience' => $doctorProfile->experience ?? null,
                'photoUrl' => $user->profile_photo ? asset('uploads/profiles/' . $user->profile_photo) : null,
            ]
        ]);
    }

    /**
     * Télécharger et mettre à jour la photo de profil du médecin
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfilePhoto(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un médecin
        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Validation de la requête
        $request->validate([
            'profile_photo' => 'required|image|mimes:jpeg,png,jpg|max:2048', // 2MB max
        ]);
        
        try {
            Log::info('Doctor profile photo upload started');
            
            // Vérifier si une image a été envoyée
            if ($request->hasFile('profile_photo')) {
                $image = $request->file('profile_photo');
                Log::info('Photo received successfully', [
                    'original_name' => $image->getClientOriginalName(),
                    'size' => $image->getSize(),
                    'mime' => $image->getMimeType()
                ]);
                
                // Supprimer l'ancienne photo si elle existe
                if ($user->profile_photo && file_exists(public_path('uploads/profiles/' . $user->profile_photo))) {
                    unlink(public_path('uploads/profiles/' . $user->profile_photo));
                    Log::info('Old photo deleted');
                }
                
                // Générer un nom unique pour l'image
                $fileName = time() . '.' . $image->getClientOriginalExtension();
                Log::info('Generated filename: ' . $fileName);
                
                // Créer le dossier s'il n'existe pas
                $uploadPath = public_path('uploads/profiles');
                if (!file_exists($uploadPath)) {
                    mkdir($uploadPath, 0777, true);
                    Log::info('Upload directory created: ' . $uploadPath);
                } else {
                    Log::info('Upload directory already exists: ' . $uploadPath);
                }
                
                try {
                    // Déplacer l'image
                    $image->move($uploadPath, $fileName);
                    Log::info('Image moved successfully to: ' . $uploadPath . '/' . $fileName);
                    
                    // Mettre à jour le chemin de la photo dans le modèle utilisateur
                    $user->profile_photo = $fileName;
                    $user->save();
                    Log::info('User record updated with new profile_photo path');
                    
                    // Générer l'URL publique de la photo
                    $photoUrl = asset('uploads/profiles/' . $fileName);
                    Log::info('Photo URL generated: ' . $photoUrl);
                    
                    // Envoyer une notification au médecin
                    $this->notificationService->sendNotification(
                        $user,
                        'Photo de profil mise à jour',
                        'Votre photo de profil a été mise à jour avec succès.',
                        'success',
                        '/doctor/profile'
                    );
                    
                    return response()->json([
                        'message' => 'Photo de profil mise à jour avec succès',
                        'photo_url' => $photoUrl
                    ]);
                } catch (\Exception $e) {
                    Log::error('Error processing image: ' . $e->getMessage());
                    Log::error($e->getTraceAsString());
                    throw $e; // Relancer l'exception pour être capturée par le bloc externe
                }
            } else {
                Log::warning('No image file was sent');
                return response()->json([
                    'message' => 'Aucune image n\'a été envoyée',
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Error uploading doctor profile photo: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la photo de profil',
                'error' => $e->getMessage()
            ], 500);
        }
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
    
    // CORRECTION : Validation mise à jour
    $validatedData = $request->validate([
        'patient_id' => 'required|exists:users,id',
        'appointment_id' => 'nullable|integer|exists:appointments,id', // Changé de exists:appointments,id
        'date' => 'required|date',
        'type' => 'required|in:consultation,analyse,chirurgie,suivi,autre',
        'diagnosis' => 'required|string',
        'notes' => 'nullable|string',
        'documents' => 'nullable|array',
        'documents.*.name' => 'required|string',
        'documents.*.type' => 'required|string',
    ]);
    
    // CORRECTION : Debug des données reçues
    \Log::info('Données reçues pour création dossier médical:', $validatedData);
    
    // Vérifier que le médecin a déjà vu ce patient
    $hasAppointment = Appointment::where('doctor_id', $user->id)
        ->where('patient_id', $validatedData['patient_id'])
        ->exists();
    
    if (!$hasAppointment) {
        return response()->json(['message' => 'Vous n\'êtes pas autorisé à créer un dossier médical pour ce patient'], 403);
    }
    
    // CORRECTION : Validation spécifique pour appointment_id
    $appointmentId = null;
    if (!empty($validatedData['appointment_id'])) {
        $appointment = Appointment::where('id', $validatedData['appointment_id'])
            ->where('doctor_id', $user->id)
            ->where('patient_id', $validatedData['patient_id'])
            ->first();
        
        if (!$appointment) {
            return response()->json(['message' => 'Ce rendez-vous n\'existe pas ou ne vous appartient pas'], 404);
        }
        
        // Vérifier qu'un dossier médical n'existe pas déjà pour ce rendez-vous
        $existingRecord = MedicalRecord::where('appointment_id', $validatedData['appointment_id'])->first();
        if ($existingRecord) {
            return response()->json(['message' => 'Un dossier médical existe déjà pour ce rendez-vous'], 400);
        }
        
        $appointmentId = $validatedData['appointment_id'];
    }
    
    // CORRECTION : Création explicite avec appointment_id
    $medicalRecord = new MedicalRecord([
        'patient_id' => $validatedData['patient_id'],
        'doctor_id' => $user->id,
        'appointment_id' => $appointmentId, // Utiliser la variable validée
        'date' => $validatedData['date'],
        'type' => $validatedData['type'],
        'diagnosis' => $validatedData['diagnosis'],
        'notes' => $validatedData['notes'] ?? null,
    ]);
    
    // CORRECTION : Debug avant sauvegarde
    \Log::info('Dossier médical avant sauvegarde:', [
        'patient_id' => $medicalRecord->patient_id,
        'doctor_id' => $medicalRecord->doctor_id,
        'appointment_id' => $medicalRecord->appointment_id,
        'date' => $medicalRecord->date,
        'type' => $medicalRecord->type,
        'diagnosis' => $medicalRecord->diagnosis,
    ]);
    
    $medicalRecord->save();
    
    // CORRECTION : Debug après sauvegarde
    \Log::info('Dossier médical après sauvegarde:', [
        'id' => $medicalRecord->id,
        'appointment_id' => $medicalRecord->appointment_id,
    ]);
    
    // Traiter les documents si présents
    if (isset($validatedData['documents']) && is_array($validatedData['documents'])) {
        foreach ($validatedData['documents'] as $docData) {
            $document = new Document([
                'medical_record_id' => $medicalRecord->id,
                'name' => $docData['name'],
                'file_path' => 'placeholder/path/' . $docData['name'],
                'type' => $docData['type'],
            ]);
            
            $document->save();
        }
    }
    
    // CORRECTION : Mettre à jour le statut du rendez-vous seulement si appointment_id est fourni
    if ($appointmentId) {
        $appointment = Appointment::find($appointmentId);
        if ($appointment) {
            $appointment->status = 'confirmé';
            $appointment->save();
            \Log::info('Statut du rendez-vous mis à jour:', ['appointment_id' => $appointmentId]);
        }
    }
    
    // Récupérer le patient pour envoyer une notification
    $patient = User::find($validatedData['patient_id']);
    
    // Envoyer une notification au patient
    $this->notificationService->sendMedicalRecordNotification(
        $patient,
        [
            'date' => $validatedData['date'],
            'type' => $validatedData['type'],
            'doctor' => $user->name
        ]
    );
    
    return response()->json([
        'message' => 'Dossier médical créé avec succès',
        'medical_record' => [
            'id' => $medicalRecord->id,
            'date' => $medicalRecord->date,
            'type' => $medicalRecord->type,
            'diagnosis' => $medicalRecord->diagnosis,
            'appointment_id' => $medicalRecord->appointment_id, // Inclure dans la réponse
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
        
        // Récupérer le patient pour envoyer une notification
        $patient = User::find($validatedData['patient_id']);
        
        // Envoyer une notification au patient
        $this->notificationService->sendPrescriptionNotification(
            $patient,
            [
                'date' => $validatedData['date'],
                'doctor' => $user->name,
                'medications_count' => count($validatedData['medications'])
            ]
        );
        
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
    
    // Récupérer le document avec sa relation au dossier médical
    $document = Document::with('medicalRecord')->findOrFail($id);
    
    // Vérifier que le médecin a le droit d'accéder à ce document
    // Soit il est l'auteur du dossier médical, soit il a un rendez-vous avec ce patient
    $isAuthor = $document->medicalRecord->doctor_id === $user->id;
    $hasAppointment = Appointment::where('doctor_id', $user->id)
        ->where('patient_id', $document->medicalRecord->patient_id)
        ->exists();
    
    if (!$isAuthor && !$hasAppointment) {
        return response()->json(['message' => 'Vous n\'êtes pas autorisé à accéder à ce document'], 403);
    }
    
    // Vérifier que le fichier existe physiquement
    $filePath = storage_path('app/' . $document->file_path);
    if (!file_exists($filePath)) {
        return response()->json(['message' => 'Fichier non trouvé'], 404);
    }
    
    // Générer l'en-tête Content-Disposition pour définir le nom du fichier
    $headers = [
        'Content-Type' => $document->type,
        'Content-Disposition' => 'attachment; filename="' . $document->name . '"',
    ];
    
    // Journaliser le téléchargement
    Log::info('Document téléchargé', [
        'document_id' => $document->id,
        'document_name' => $document->name,
        'doctor_id' => $user->id,
        'doctor_name' => $user->name,
    ]);
    
    // Retourner le fichier
    return response()->download($filePath, $document->name, $headers);
}

    public function previewDocument($id)
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un médecin
    if (!$user->isDoctor()) {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Récupérer le document
    $document = Document::with('medicalRecord')->findOrFail($id);
    
    // Vérifier que le médecin a le droit d'accéder à ce document
    $isAuthor = $document->medicalRecord->doctor_id === $user->id;
    $hasAppointment = Appointment::where('doctor_id', $user->id)
        ->where('patient_id', $document->medicalRecord->patient_id)
        ->exists();
    
    if (!$isAuthor && !$hasAppointment) {
        return response()->json(['message' => 'Vous n\'êtes pas autorisé à accéder à ce document'], 403);
    }
    
    // Vérifier que le fichier existe
    $filePath = storage_path('app/' . $document->file_path);
    if (!file_exists($filePath)) {
        return response()->json(['message' => 'Fichier non trouvé'], 404);
    }
    
    // Déterminer le type MIME
    $type = $document->type;
    
    // Pour certains types de fichiers, on peut prévisualiser directement
    $previewableTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/svg+xml',
        'image/webp',
        'text/plain',
        'text/html'
    ];
    
    if (in_array($type, $previewableTypes)) {
        // Pour les images et PDF, on les renvoie directement
        $headers = [
            'Content-Type' => $type,
            'Content-Disposition' => 'inline; filename="' . $document->name . '"',
        ];
        
        return response()->file($filePath, $headers);
    } else {
        // Pour les autres types, on renvoie un aperçu limité ou un message
        return response()->json([
            'message' => 'Prévisualisation non disponible pour ce type de fichier',
            'document' => [
                'id' => $document->id,
                'name' => $document->name,
                'type' => $document->type,
                'size' => filesize($filePath),
                'created_at' => $document->created_at,
            ]
        ]);
    }
}

    /**
     * Récupérer la disponibilité d'un médecin pour une date donnée
     */
    public function getDocumentDetails($id)
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un médecin
    if (!$user->isDoctor()) {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Récupérer le document avec sa relation au dossier médical
    $document = Document::with('medicalRecord')->findOrFail($id);
    
    // Vérifier que le médecin a le droit d'accéder à ce document
    $isAuthor = $document->medicalRecord->doctor_id === $user->id;
    $hasAppointment = Appointment::where('doctor_id', $user->id)
        ->where('patient_id', $document->medicalRecord->patient_id)
        ->exists();
    
    if (!$isAuthor && !$hasAppointment) {
        return response()->json(['message' => 'Vous n\'êtes pas autorisé à accéder à ce document'], 403);
    }
    
    // Vérifier que le fichier existe pour obtenir sa taille
    $filePath = storage_path('app/' . $document->file_path);
    $fileSize = file_exists($filePath) ? filesize($filePath) : null;
    
    // Retourner les informations du document
    return response()->json([
        'document' => [
            'id' => $document->id,
            'name' => $document->name,
            'type' => $document->type,
            'file_path' => $document->file_path,
            'size' => $fileSize,
            'created_at' => $document->created_at,
            'updated_at' => $document->updated_at,
            'medical_record_id' => $document->medical_record_id,
            'medical_record' => [
                'id' => $document->medicalRecord->id,
                'patient_id' => $document->medicalRecord->patient_id,
                'patient_name' => $document->medicalRecord->patient->name,
                'date' => $document->medicalRecord->date,
                'type' => $document->medicalRecord->type,
                'diagnosis' => $document->medicalRecord->diagnosis,
            ]
        ]
    ]);
}



/**
 * Récupérer la disponibilité d'un médecin pour une date donnée
 */
public function getAvailability(Request $request, $doctor_id)
{
    // Valider les paramètres de la requête
    $validatedData = $request->validate([
        'date' => 'required|date',
    ]);
    
    // Vérifier que l'utilisateur spécifié est bien un médecin
    $doctor = User::find($doctor_id);
    if (!$doctor || !$doctor->isDoctor()) {
        return response()->json(['message' => 'Médecin non trouvé'], 404);
    }
    
    // Obtenir le jour de la semaine pour la date donnée
    $dayOfWeek = strtolower(date('l', strtotime($validatedData['date'])));
    
    // Récupérer l'horaire du médecin pour ce jour
    $schedule = DoctorSchedule::where('doctor_id', $doctor_id)
        ->where('day_of_week', $dayOfWeek)
        ->first();
    
    // Si aucun horaire n'est défini ou si le médecin n'est pas disponible ce jour-là
    if (!$schedule || !$schedule->is_available) {
        // Le médecin n'est pas disponible ce jour-là
        return response()->json([
            'doctor_id' => $doctor_id,
            'doctor_name' => $doctor->name,
            'date' => $validatedData['date'],
            'day_of_week' => $dayOfWeek,
            'has_custom_schedule' => ($schedule !== null),
            'is_available' => false,
            'time_slots' => [] // Aucun créneau disponible
        ]);
    }
    
    // Définir la durée d'un rendez-vous en minutes (30 minutes par défaut)
    $appointmentDuration = 30;
    
    // Préparer les créneaux disponibles
    $allTimeSlots = [];
    
    // Convertir les heures en minutes
    $startMinutes = $this->timeToMinutes($schedule->start_time);
    $endMinutes = $this->timeToMinutes($schedule->end_time);
    
    // Générer les créneaux par pas de 30 minutes
    for ($minutes = $startMinutes; $minutes < $endMinutes; $minutes += $appointmentDuration) {
        $allTimeSlots[] = $this->minutesToTime($minutes);
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
        'day_of_week' => $dayOfWeek,
        'has_custom_schedule' => true,
        'is_available' => true,
        'schedule' => [
            'start_time' => $schedule->start_time,
            'end_time' => $schedule->end_time,
        ],
        'time_slots' => $availability
    ]);
}


    /**
 * Get all invoices for the doctor with optional filters.
 */
public function getInvoices(Request $request)
{
    $user = Auth::user();
    
    // Verify user is a doctor
    if (!$user->isDoctor()) {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    try {
        // Base query for invoices
        $query = Invoice::query()
            ->join('users as patients', 'invoices.patient_id', '=', 'patients.id')
            ->select('invoices.*', 'patients.name as patient_name')
            ->orderBy('invoices.created_at', 'desc');
            
        // Apply filters
        if ($request->has('status')) {
            $query->where('invoices.status', $request->status);
        }
        
        if ($request->has('date_from')) {
            $query->whereDate('invoices.date', '>=', $request->date_from);
        }
        
        if ($request->has('date_to')) {
            $query->whereDate('invoices.date', '<=', $request->date_to);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoices.number', 'like', "%{$search}%")
                  ->orWhere('patients.name', 'like', "%{$search}%");
            });
        }
        
        // Filter by patients who have had appointments with this doctor
        $patientIds = Appointment::where('doctor_id', $user->id)
            ->pluck('patient_id')
            ->unique()
            ->toArray();
        
        $query->whereIn('invoices.patient_id', $patientIds);
        
        // Fetch invoices with patient information
        $invoices = $query->with(['items'])->get();
        
        // Format the response data
        $formattedInvoices = $invoices->map(function ($invoice) {
            return [
                'id' => $invoice->id,
                'patient_id' => $invoice->patient_id,
                'patient_name' => $invoice->patient_name,
                'number' => $invoice->number,
                'date' => $invoice->date,
                'due_date' => $invoice->due_date,
                'amount' => $invoice->amount,
                'tax_percent' => $invoice->tax_percent,
                'tax_amount' => $invoice->tax_amount,
                'total_amount' => $invoice->total_amount,
                'status' => $invoice->status,
                'payment_method' => $invoice->payment_method,
                'payment_date' => $invoice->payment_date,
                'notes' => $invoice->notes,
                'created_at' => $invoice->created_at->format('Y-m-d H:i:s'),
                'items' => $invoice->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'total_price' => $item->total_price,
                        'type' => $item->type,
                    ];
                }),
            ];
        });
        
        // Calculate some statistics
        $stats = [
            'total' => $invoices->count(),
            'paid' => $invoices->where('status', 'paid')->count(),
            'unpaid' => $invoices->where('status', 'unpaid')->count(),
            'overdue' => $invoices->where('status', 'unpaid')
                ->where('due_date', '<', now()->format('Y-m-d'))
                ->count(),
            'total_amount' => $invoices->sum('total_amount'),
            'paid_amount' => $invoices->where('status', 'paid')->sum('total_amount'),
            'unpaid_amount' => $invoices->where('status', 'unpaid')->sum('total_amount'),
        ];
        
        return response()->json([
            'invoices' => $formattedInvoices,
            'stats' => $stats
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de la récupération des factures',
            'error' => $e->getMessage()
        ], 500);
    }
}

/**
 * Get invoices for a specific patient of the doctor.
 */
public function getPatientInvoices($patientId)
{
    $user = Auth::user();
    
    // Verify user is a doctor
    if (!$user->isDoctor()) {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Verify this doctor has seen the patient
    $hasAppointment = Appointment::where('doctor_id', $user->id)
        ->where('patient_id', $patientId)
        ->exists();
    
    if (!$hasAppointment) {
        return response()->json(['message' => 'Vous n\'êtes pas autorisé à accéder aux informations de ce patient'], 403);
    }
    
    try {
        // Fetch the patient's invoices
        $invoices = Invoice::where('patient_id', $patientId)
            ->with(['items'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Format the response data
        $formattedInvoices = $invoices->map(function ($invoice) {
            return [
                'id' => $invoice->id,
                'patient_id' => $invoice->patient_id,
                'number' => $invoice->number,
                'date' => $invoice->date,
                'due_date' => $invoice->due_date,
                'amount' => $invoice->amount,
                'tax_percent' => $invoice->tax_percent,
                'tax_amount' => $invoice->tax_amount,
                'total_amount' => $invoice->total_amount,
                'status' => $invoice->status,
                'payment_method' => $invoice->payment_method,
                'payment_date' => $invoice->payment_date,
                'notes' => $invoice->notes,
                'created_at' => $invoice->created_at->format('Y-m-d H:i:s'),
                'items' => $invoice->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'total_price' => $item->total_price,
                        'type' => $item->type,
                    ];
                }),
            ];
        });
        
        return response()->json([
            'invoices' => $formattedInvoices
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de la récupération des factures du patient',
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function getMedicalRecords()
{
    $user = Auth::user();
    
    // Verify user is a doctor
    if (!$user->isDoctor()) {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    try {
        // Get all medical records created by this doctor
        $medicalRecords = MedicalRecord::where('doctor_id', $user->id)
            ->with(['patient:id,name,email', 'documents'])
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'date' => $record->date,
                    'type' => $record->type,
                    'patient_id' => $record->patient_id,
                    'patient_name' => $record->patient->name,
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
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de la récupération des dossiers médicaux',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
 * Récupérer les ordonnances créées par le médecin
 */
/**
 * Récupérer les ordonnances créées par le médecin avec les informations du dossier médical
 */
public function getPrescriptions()
{
    $user = Auth::user();
    
    // Vérifier que l'utilisateur est un médecin
    if (!$user->isDoctor()) {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
    
    // Récupérer les ordonnances du médecin avec les informations du patient, des médicaments et du dossier médical
    $prescriptions = $user->doctorPrescriptions()
        ->with(['patient:id,name,email', 'medications', 'medicalRecord'])
        ->orderBy('date', 'desc')
        ->get();
    
    // Formater les données pour la réponse
    $formattedPrescriptions = $prescriptions->map(function ($prescription) {
        return [
            'id' => $prescription->id,
            'date' => $prescription->date,
            'patient_id' => $prescription->patient_id,
            'patient_name' => $prescription->patient->name,
            'medical_record_id' => $prescription->medical_record_id, // Ajouté
            'medical_record' => $prescription->medicalRecord ? [
                'id' => $prescription->medicalRecord->id,
                'date' => $prescription->medicalRecord->date,
                'type' => $prescription->medicalRecord->type,
                'diagnosis' => $prescription->medicalRecord->diagnosis,
            ] : null,
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
    
    return response()->json([
        'prescriptions' => $formattedPrescriptions
    ]);
}

    /**
     * Récupérer les dates avec des rendez-vous pour un médecin dans un mois donné
     * 
     * @param Request $request
     * @param int $doctor_id
     * @return \Illuminate\Http\JsonResponse
     */
    /**
 * Récupérer les dates avec des rendez-vous pour un médecin dans un mois donné
 * 
 * @param Request $request
 * @param int $doctor_id
 * @return \Illuminate\Http\JsonResponse
 */
public function getMonthlyAvailability(Request $request, $doctor_id)
{
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
    
    // Récupérer les horaires du médecin
    $doctorSchedules = DoctorSchedule::where('doctor_id', $doctor_id)->get()->keyBy('day_of_week');
    
    // Créer un tableau avec le nombre de rendez-vous par date
    $dateAvailability = [];
    $currentDate = new \DateTime($startDate);
    $endDateTime = new \DateTime($endDate);
    
    while ($currentDate <= $endDateTime) {
        $dateStr = $currentDate->format('Y-m-d');
        $count = isset($appointments[$dateStr]) ? count($appointments[$dateStr]) : 0;
        
        // Obtenir le jour de la semaine au format lowercase
        $dayOfWeek = strtolower($currentDate->format('l'));
        
        // Vérifier si le médecin a défini un horaire pour ce jour et s'il est disponible
        $isDoctorAvailable = $doctorSchedules->has($dayOfWeek) && $doctorSchedules[$dayOfWeek]->is_available;
        
        // Calculer la disponibilité
        $maxSlots = 20; // Valeur par défaut
        $availabilityStatus = 'available';
        
        // Si le médecin n'est pas disponible ce jour-là
        if (!$isDoctorAvailable) {
            $availabilityStatus = 'unavailable';
        } 
        // Sinon, vérifier la disponibilité en fonction des rendez-vous existants
        else if ($count >= $maxSlots) {
            $availabilityStatus = 'full';
        } else if ($count > 0) {
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
            'day_of_week' => $dayOfWeek,
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

private function timeToMinutes($time)
{
    list($hours, $minutes) = explode(':', $time);
    return intval($hours) * 60 + intval($minutes);
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
}