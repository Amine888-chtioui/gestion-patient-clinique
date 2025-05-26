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
use App\Models\Invoice;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Exception;
use App\Services\NotificationService;
use Barryvdh\DomPDF\Facade\Pdf;

class PatientController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    // ==================== GESTION DES RENDEZ-VOUS ====================

    /**
     * Récupérer les rendez-vous du patient
     */
    public function getAppointments()
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $appointments = $user->patientAppointments()
            ->with('doctor:id,name')
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();
        
        $formattedAppointments = $appointments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'doctor' => $appointment->doctor->name,
                'specialty' => 'À implémenter',
                'status' => $appointment->status,
                'reason' => $appointment->reason,
            ];
        });
        
        return response()->json(['appointments' => $formattedAppointments]);
    }

    /**
     * Créer un nouveau rendez-vous
     */
    public function createAppointment(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validatedData = $request->validate([
            'date' => 'required|date|after:today',
            'time' => 'required',
            'doctor_id' => 'required|exists:users,id',
            'reason' => 'required|string|max:500',
        ]);
        
        $doctor = User::find($validatedData['doctor_id']);
        if (!$doctor || !$doctor->isDoctor()) {
            return response()->json(['message' => 'Médecin non trouvé'], 404);
        }
        
        // Vérifier la disponibilité
        $existingAppointment = Appointment::where('doctor_id', $validatedData['doctor_id'])
            ->where('date', $validatedData['date'])
            ->where('time', $validatedData['time'])
            ->where('status', '!=', 'annulé')
            ->first();
        
        if ($existingAppointment) {
            return response()->json([
                'message' => 'Ce créneau horaire n\'est pas disponible.'
            ], 422);
        }
        
        $appointment = Appointment::create([
            'patient_id' => $user->id,
            'doctor_id' => $validatedData['doctor_id'],
            'date' => $validatedData['date'],
            'time' => $validatedData['time'],
            'reason' => $validatedData['reason'],
            'status' => 'en attente',
        ]);
        
        // Notification au médecin
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
     * Mettre à jour un rendez-vous
     */
    public function updateAppointment(Request $request, $id)
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $appointment = Appointment::where('id', $id)
            ->where('patient_id', $user->id)
            ->first();
        
        if (!$appointment) {
            return response()->json(['message' => 'Rendez-vous non trouvé'], 404);
        }
        
        if ($appointment->status === 'annulé') {
            return response()->json(['message' => 'Impossible de modifier un rendez-vous annulé'], 400);
        }
        
        if ($appointment->date < now()->toDateString()) {
            return response()->json(['message' => 'Impossible de modifier un rendez-vous passé'], 400);
        }
        
        $validatedData = $request->validate([
            'date' => 'sometimes|required|date|after:today',
            'time' => 'sometimes|required',
            'reason' => 'sometimes|required|string|max:500',
        ]);
        
        // Vérifier la disponibilité si date/heure change
        if (isset($validatedData['date']) || isset($validatedData['time'])) {
            $date = $validatedData['date'] ?? $appointment->date;
            $time = $validatedData['time'] ?? $appointment->time;
            
            $existingAppointment = Appointment::where('doctor_id', $appointment->doctor_id)
                ->where('date', $date)
                ->where('time', $time)
                ->where('status', '!=', 'annulé')
                ->where('id', '!=', $appointment->id)
                ->first();
            
            if ($existingAppointment) {
                return response()->json([
                    'message' => 'Ce créneau horaire n\'est pas disponible.'
                ], 422);
            }
        }
        
        $oldDate = $appointment->date;
        $oldTime = $appointment->time;
        
        $appointment->update($validatedData);
        
        if (isset($validatedData['date']) || isset($validatedData['time'])) {
            $appointment->status = 'en attente';
            $appointment->save();
        }
        
        $doctor = User::find($appointment->doctor_id);
        
        // Notifications
        $this->notificationService->sendNotification(
            $user,
            'Rendez-vous modifié',
            "Votre rendez-vous initialement prévu le {$oldDate} à {$oldTime} a été modifié pour le {$appointment->date} à {$appointment->time}.",
            'appointment',
            '/patient/dashboard?tab=appointments'
        );
        
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

    /**
     * Annuler un rendez-vous
     */
    public function cancelAppointment($id)
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $appointment = Appointment::where('id', $id)
            ->where('patient_id', $user->id)
            ->first();
        
        if (!$appointment) {
            return response()->json(['message' => 'Rendez-vous non trouvé'], 404);
        }
        
        if ($appointment->status === 'annulé') {
            return response()->json(['message' => 'Ce rendez-vous est déjà annulé'], 400);
        }
        
        if ($appointment->date < now()->toDateString()) {
            return response()->json(['message' => 'Impossible d\'annuler un rendez-vous passé'], 400);
        }
        
        $appointment->status = 'annulé';
        $appointment->save();
        
        $doctor = User::find($appointment->doctor_id);
        
        // Notifications
        $this->notificationService->sendAppointmentNotification(
            $user,
            [
                'date' => $appointment->date,
                'time' => $appointment->time,
                'doctor' => $doctor->name
            ],
            'cancelled'
        );
        
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

    // ==================== DOSSIERS MÉDICAUX ====================

    /**
     * Récupérer les dossiers médicaux du patient
     */
    public function getMedicalRecords()
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $medicalRecords = $user->patientMedicalRecords()
            ->with(['doctor:id,name', 'documents'])
            ->orderBy('date', 'desc')
            ->get();
        
        $formattedRecords = $medicalRecords->map(function ($record) {
            return [
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
        });
        
        return response()->json(['medicalRecords' => $formattedRecords]);
    }

    /**
     * Télécharger un document
     */
    public function downloadDocument($id)
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $document = Document::with('medicalRecord')->findOrFail($id);
        
        if ($document->medicalRecord->patient_id !== $user->id) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        if (!Storage::exists($document->file_path)) {
            return response()->json(['message' => 'Fichier non trouvé'], 404);
        }
        
        return Storage::download($document->file_path, $document->name);
    }

    // ==================== ORDONNANCES ====================

    /**
     * Récupérer les ordonnances du patient
     */
    public function getPrescriptions()
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $prescriptions = $user->patientPrescriptions()
            ->with(['doctor:id,name', 'medications'])
            ->orderBy('date', 'desc')
            ->get();
        
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
        
        return response()->json(['prescriptions' => $formattedPrescriptions]);
    }

    /**
     * Télécharger une ordonnance en PDF
     */
    public function downloadPrescriptionPdf($id)
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $prescription = Prescription::where('id', $id)
            ->where('patient_id', $user->id)
            ->with(['doctor:id,name', 'medications'])
            ->first();
        
        if (!$prescription) {
            return response()->json(['message' => 'Ordonnance non trouvée'], 404);
        }
        
        $patientProfile = $user->patientProfile;
        
        $data = [
            'prescription' => $prescription,
            'patient' => $user,
            'patientProfile' => $patientProfile,
            'doctor' => $prescription->doctor,
            'medications' => $prescription->medications,
            'dateGeneration' => now()->format('d/m/Y à H:i'),
            'clinicInfo' => [
                'name' => 'Centre Médical',
                'address' => '123 Rue de la Santé, 12345 Ville',
                'phone' => '01 23 45 67 89',
                'email' => 'contact@centre-medical.fr',
                'siret' => '123 456 789 00012'
            ]
        ];
        
        try {
            $pdf = PDF::loadView('pdf.prescription', $data);
            $pdf->setPaper('A4', 'portrait');
            $pdf->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => true
            ]);
            
            $fileName = 'ordonnance_' . $prescription->id . '_' . date('Y-m-d') . '.pdf';
            
            return $pdf->download($fileName);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération du PDF de l\'ordonnance: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la génération du PDF.'
            ], 500);
        }
    }

    // ==================== PROFIL PATIENT ====================

    /**
     * Récupérer le profil du patient
     */
    public function getProfile()
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $profile = $user->patientProfile ?? new PatientProfile(['user_id' => $user->id]);
        
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
            'photoUrl' => $user->profile_photo ? asset('uploads/profiles/' . $user->profile_photo) : null,
        ];
        
        return response()->json(['profile' => $formattedProfile]);
    }

    /**
     * Mettre à jour le profil du patient
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'blood_type' => 'nullable|string|max:10',
            'allergies' => 'nullable|array',
            'chronic_diseases' => 'nullable|array',
            'emergency_contact' => 'nullable|string',
            'medical_history' => 'nullable|string',
        ]);
        
        // Mise à jour des informations utilisateur
        if (isset($validatedData['name'])) {
            $user->name = $validatedData['name'];
        }
        
        if (isset($validatedData['email'])) {
            $user->email = $validatedData['email'];
        }
        
        $user->save();
        
        // Mise à jour du profil patient
        $profile = $user->patientProfile ?? new PatientProfile(['user_id' => $user->id]);
        
        $profileFields = [
            'phone', 'date_of_birth', 'address', 'blood_type', 
            'emergency_contact', 'medical_history'
        ];
        
        foreach ($profileFields as $field) {
            if (isset($validatedData[$field])) {
                $profile->$field = $validatedData[$field];
            }
        }
        
        if (isset($validatedData['allergies'])) {
            $profile->allergies = implode(',', $validatedData['allergies']);
        }
        
        if (isset($validatedData['chronic_diseases'])) {
            $profile->chronic_diseases = implode(',', $validatedData['chronic_diseases']);
        }
        
        $user->patientProfile()->save($profile);
        
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
            'photoUrl' => $user->profile_photo ? asset('uploads/profiles/' . $user->profile_photo) : null,
        ];
        
        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'profile' => $formattedProfile
        ]);
    }
    
    /**
     * Mettre à jour la photo de profil
     */
    public function updateProfilePhoto(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $request->validate([
            'profile_photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);
        
        try {
            if ($request->hasFile('profile_photo')) {
                $image = $request->file('profile_photo');
                
                // Supprimer l'ancienne photo
                if ($user->profile_photo && file_exists(public_path('uploads/profiles/' . $user->profile_photo))) {
                    unlink(public_path('uploads/profiles/' . $user->profile_photo));
                }
                
                // Générer un nom unique
                $fileName = 'patient_' . $user->id . '_' . time() . '.' . $image->getClientOriginalExtension();
                
                // Créer le dossier si nécessaire
                $uploadPath = public_path('uploads/profiles');
                if (!file_exists($uploadPath)) {
                    mkdir($uploadPath, 0777, true);
                }
                
                // Déplacer l'image
                $image->move($uploadPath, $fileName);
                
                // Mettre à jour le modèle
                $user->profile_photo = $fileName;
                $user->save();
                
                $photoUrl = asset('uploads/profiles/' . $fileName);
                
                return response()->json([
                    'message' => 'Photo de profil mise à jour avec succès',
                    'photo_url' => $photoUrl
                ]);
            } else {
                return response()->json([
                    'message' => 'Aucune image n\'a été envoyée',
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'upload de photo patient: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la photo de profil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== FACTURES ====================

    /**
     * Récupérer toutes les factures du patient
     */
    public function getInvoices(Request $request)
    {
        $patientId = auth()->id();
        
        $query = Invoice::where('patient_id', $patientId)
            ->with(['appointment'])
            ->orderBy('created_at', 'desc');
        
        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        
        if ($request->has('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }
        
        $invoices = $query->paginate(10);
        
        return response()->json([
            'invoices' => $invoices,
            'unpaid_total' => Invoice::where('patient_id', $patientId)
                                ->where('status', 'unpaid')
                                ->sum('total_amount'),
        ]);
    }

    /**
     * Récupérer une facture spécifique
     */
    public function getInvoice($id)
    {
        $patientId = auth()->id();
        
        $invoice = Invoice::with(['items', 'appointment'])
                    ->where('patient_id', $patientId)
                    ->findOrFail($id);
        
        return response()->json(['invoice' => $invoice]);
    }

    /**
     * Télécharger une facture en PDF
     */
    public function downloadInvoicePdf($id)
    {
        $user = Auth::user();
        
        if (!$user->isPatient()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $invoice = Invoice::where('id', $id)
            ->where('patient_id', $user->id)
            ->with(['items'])
            ->first();
        
        if (!$invoice) {
            return response()->json(['message' => 'Facture non trouvée'], 404);
        }
        
        $patientProfile = $user->patientProfile;
        
        // Calculer les totaux
        $subtotal = $invoice->amount ?? $invoice->items->sum(function($item) {
            return $item->quantity * $item->unit_price;
        });
        
        $taxAmount = $invoice->tax_amount ?? ($subtotal * ($invoice->tax_percent / 100));
        $total = $invoice->total_amount ?? ($subtotal + $taxAmount);
        
        $data = [
            'invoice' => $invoice,
            'patient' => $user,
            'patientProfile' => $patientProfile,
            'items' => $invoice->items,
            'subtotal' => $subtotal,
            'taxAmount' => $taxAmount,
            'total' => $total,
            'dateGeneration' => now()->format('d/m/Y à H:i'),
            'clinicInfo' => [
                'name' => 'Centre Médical',
                'address' => '123 Rue de la Santé, 12345 Ville',
                'phone' => '01 23 45 67 89',
                'email' => 'contact@centre-medical.fr',
                'siret' => '123 456 789 00012',
                'tva' => 'FR12345678901'
            ]
        ];
        
        try {
            $pdf = PDF::loadView('pdf.invoice', $data);
            $pdf->setPaper('A4', 'portrait');
            $pdf->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => true
            ]);
            
            $fileName = 'facture_' . ($invoice->number ?? $invoice->id) . '_' . date('Y-m-d') . '.pdf';
            
            return $pdf->download($fileName);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération du PDF de la facture: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la génération du PDF.'
            ], 500);
        }
    }
}