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
use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Log;
use Exception;
use App\Services\NotificationService;

class PatientController extends Controller
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
    
    // Vérifier si le médecin a déjà un rendez-vous à cette date et heure
    $existingAppointment = Appointment::where('doctor_id', $validatedData['doctor_id'])
        ->where('date', $validatedData['date'])
        ->where('time', $validatedData['time'])
        ->where('status', '!=', 'annulé') // Ignorer les rendez-vous annulés
        ->first();
    
    // Si un rendez-vous existe déjà, renvoyer une erreur
    if ($existingAppointment) {
        return response()->json([
            'message' => 'Ce créneau horaire n\'est pas disponible. Veuillez choisir une autre date ou heure.'
        ], 422);
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
    
    // Envoyer une notification au médecin (pas au patient)
    $this->notificationService->sendNotification(
        $doctor,
        'Nouvelle demande de rendez-vous',
        "Un nouveau rendez-vous a été demandé par {$user->name} pour le {$appointment->date} à {$appointment->time}.",
        'appointment',
        '/doctor/dashboard?tab=appointments'
    );
    
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
     * Récupérer un dossier médical spécifique
     */
    public function getMedicalRecord($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer le dossier médical avec les informations du médecin et les documents
        $record = MedicalRecord::where('id', $id)
            ->where('patient_id', $user->id)
            ->with(['doctor:id,name', 'documents'])
            ->first();
        
        if (!$record) {
            return response()->json(['message' => 'Dossier médical non trouvé'], 404);
        }
        
        // Formater les données pour la réponse
        $formattedRecord = [
            'id' => $record->id,
            'date' => $record->date,
            'type' => $record->type,
            'doctor' => $record->doctor->name,
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
        
        return response()->json([
            'medicalRecord' => $formattedRecord
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
     * Récupérer une ordonnance spécifique
     */
    public function getPrescription($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Récupérer l'ordonnance avec les informations du médecin et les médicaments
        $prescription = Prescription::where('id', $id)
            ->where('patient_id', $user->id)
            ->with(['doctor:id,name', 'medications'])
            ->first();
        
        if (!$prescription) {
            return response()->json(['message' => 'Ordonnance non trouvée'], 404);
        }
        
        // Formater les données pour la réponse
        $formattedPrescription = [
            'id' => $prescription->id,
            'date' => $prescription->date,
            'doctor' => $prescription->doctor->name,
            'notes' => $prescription->notes,
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
        
        return response()->json([
            'prescription' => $formattedPrescription
        ]);
    }

    /**
     * Télécharger une ordonnance au format PDF
     */
    public function downloadPrescription($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // À implémenter: Générer un PDF de l'ordonnance
        // Cette fonction nécessite l'intégration d'une bibliothèque de génération de PDF comme DOMPDF
        
        return response()->json([
            'message' => 'Fonctionnalité en cours de développement'
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
            'photoUrl' => $profile->profile_photo ? asset('uploads/profiles/' . $profile->profile_photo) : null,
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
        
        // Envoyer une notification de mise à jour du profil
        $this->notificationService->sendNotification(
            $user,
            'Profil mis à jour',
            'Vos informations personnelles ont été mises à jour avec succès.',
            'success',
            '/patient/dashboard?tab=profile'
        );
        
        // Préparer la réponse avec le profil mis à jour
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
            'photoUrl' => $profile->profile_photo ? asset('uploads/profiles/' . $profile->profile_photo) : null,
        ];
        
        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'profile' => $formattedProfile
        ]);
    }
    
    /**
     * Télécharger et mettre à jour la photo de profil du patient
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfilePhoto(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un patient
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        // Validation de la requête
        $request->validate([
            'profile_photo' => 'required|image|mimes:jpeg,png,jpg|max:2048', // 2MB max
        ]);
        
        try {
            Log::info('Début de la fonction uploadProfilePhoto');
            
            // Vérifier si une image a été envoyée
            if ($request->hasFile('profile_photo')) {
                Log::info('Photo reçue avec succès');
                $image = $request->file('profile_photo');
                
                // Récupérer le profil du patient, ou créer un profil s'il n'existe pas
                $profile = $user->patientProfile ?? new PatientProfile(['user_id' => $user->id]);
                Log::info('Profil patient récupéré/créé');
                
                // Supprimer l'ancienne photo si elle existe
                if ($profile->profile_photo && file_exists(public_path('uploads/profiles/' . $profile->profile_photo))) {
                    unlink(public_path('uploads/profiles/' . $profile->profile_photo));
                    Log::info('Ancienne photo supprimée');
                }
                
                // Générer un nom unique pour l'image
                $fileName = time() . '.' . $image->getClientOriginalExtension();
                Log::info('Nom de fichier généré: ' . $fileName);
                
                // Créer le dossier s'il n'existe pas
                $uploadPath = public_path('uploads/profiles');
                if (!file_exists($uploadPath)) {
                    mkdir($uploadPath, 0777, true);
                    Log::info('Dossier créé: ' . $uploadPath);
                } else {
                    Log::info('Dossier existe déjà: ' . $uploadPath);
                }
                
                try {
                    // Version sans Intervention Image
                    $image->move($uploadPath, $fileName);
                    Log::info('Image déplacée avec succès');
                    
                    /* Version avec Intervention Image (commentée)
                    $img = Image::make($image->getRealPath());
                    $img->fit(300, 300, function ($constraint) {
                        $constraint->aspectRatio();
                    })->save($uploadPath . '/' . $fileName);
                    Log::info('Image redimensionnée et enregistrée');
                    */
                    
                    // Mettre à jour le chemin de la photo dans le profil
                    $profile->profile_photo = $fileName;
                    Log::info('Chemin de la photo mis à jour dans le modèle');
                    
                    // Sauvegarder le profil
                    $user->patientProfile()->save($profile);
                    Log::info('Profil sauvegardé en base de données');
                    
                    // Générer l'URL publique de la photo
                    $photoUrl = asset('uploads/profiles/' . $fileName);
                    Log::info('URL générée: ' . $photoUrl);
                    
                    // Envoyer une notification
                    $this->notificationService->sendNotification(
                        $user,
                        'Photo de profil mise à jour',
                        'Votre photo de profil a été mise à jour avec succès.',
                        'success',
                        '/patient/dashboard?tab=profile'
                    );
                    
                    return response()->json([
                        'message' => 'Photo de profil mise à jour avec succès',
                        'photo_url' => $photoUrl
                    ]);
                } catch (\Exception $e) {
                    Log::error('Erreur lors du traitement de l\'image: ' . $e->getMessage());
                    Log::error($e->getTraceAsString());
                    throw $e; // Relancer l'exception pour être capturée par le bloc externe
                }
            } else {
                Log::warning('Aucune image n\'a été envoyée');
                return response()->json([
                    'message' => 'Aucune image n\'a été envoyée',
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'upload de photo: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la photo de profil',
                'error' => $e->getMessage()
            ], 500);
        }
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
        
        // Récupérer le médecin
        $doctor = User::find($appointment->doctor_id);
        
        // Envoyer une notification au patient
        $this->notificationService->sendAppointmentNotification(
            $user,
            [
                'date' => $appointment->date,
                'time' => $appointment->time,
                'doctor' => $doctor->name
            ],
            'cancelled'
        );
        
        // Envoyer une notification au médecin
        $this->notificationService->sendNotification(
            $doctor,
            'Rendez-vous annulé',
            "Le rendez-vous du {$appointment->date} à {$appointment->time} avec {$user->name} a été annulé par le patient.",
            'appointment',
            '/doctor/dashboard?tab=appointments'
        );
        
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

    /**
     * Mettre à jour un rendez-vous
     */
    public function updateAppointment(Request $request, $id)
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
        
        // Vérifier que le rendez-vous n'est pas déjà passé ou annulé
        if ($appointment->status === 'annulé') {
            return response()->json(['message' => 'Impossible de modifier un rendez-vous annulé'], 400);
        }
        
        if ($appointment->date < now()->toDateString() || 
            ($appointment->date == now()->toDateString() && $appointment->time < now()->toTimeString())) {
            return response()->json(['message' => 'Impossible de modifier un rendez-vous passé'], 400);
        }
        
        // Valider les données de la requête
        $validatedData = $request->validate([
            'date' => 'sometimes|required|date|after:today',
            'time' => 'sometimes|required',
            'reason' => 'sometimes|required|string|max:500',
        ]);
        
        // Vérifier la disponibilité uniquement si la date ou l'heure change
        if (isset($validatedData['date']) || isset($validatedData['time'])) {
            $date = $validatedData['date'] ?? $appointment->date;
            $time = $validatedData['time'] ?? $appointment->time;
            
            // Vérifier si le médecin a déjà un rendez-vous à cette date et heure (en excluant le rendez-vous actuel)
            $existingAppointment = Appointment::where('doctor_id', $appointment->doctor_id)
                ->where('date', $date)
                ->where('time', $time)
                ->where('status', '!=', 'annulé')
                ->where('id', '!=', $appointment->id) // Exclure le rendez-vous en cours de modification
                ->first();
            
            // Si un rendez-vous existe déjà, renvoyer une erreur
            if ($existingAppointment) {
                return response()->json([
                    'message' => 'Ce créneau horaire n\'est pas disponible. Veuillez choisir une autre date ou heure.'
                ], 422);
            }
        }
        
        // Récupérer l'ancien rendez-vous pour la notification
        $oldDate = $appointment->date;
        $oldTime = $appointment->time;
        
        // Mettre à jour les champs du rendez-vous
        if (isset($validatedData['date'])) {
            $appointment->date = $validatedData['date'];
        }
        
        if (isset($validatedData['time'])) {
            $appointment->time = $validatedData['time'];
        }
        
        if (isset($validatedData['reason'])) {
            $appointment->reason = $validatedData['reason'];
        }
        
        // Réinitialiser le statut du rendez-vous à "en attente" si la date ou l'heure a été modifiée
        if (isset($validatedData['date']) || isset($validatedData['time'])) {
            $appointment->status = 'en attente';
        }
        
        $appointment->save();
        
        // Récupérer le médecin
        $doctor = User::find($appointment->doctor_id);
        
        // Envoyer une notification au patient
        $this->notificationService->sendNotification(
            $user,
            'Rendez-vous modifié',
            "Votre rendez-vous initialement prévu le {$oldDate} à {$oldTime} a été modifié pour le {$appointment->date} à {$appointment->time}.",
            'appointment',
            '/patient/dashboard?tab=appointments'
        );
        
        // Envoyer une notification au médecin
        $this->notificationService->sendNotification(
            $doctor,
            'Rendez-vous modifié',
            "Le rendez-vous avec {$user->name} initialement prévu le {$oldDate} à {$oldTime} a été modifié pour le {$appointment->date} à {$appointment->time}.",
            'appointment',
            '/doctor/dashboard?tab=appointments'
        );
        
        return response()->json([
            'message' => 'Rendez-vous mis à jour avec succès',
            'appointment' => [
                'id' => $appointment->id,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'reason' => $appointment->reason,
                'status' => $appointment->status,
            ]
        ]);
    }
}