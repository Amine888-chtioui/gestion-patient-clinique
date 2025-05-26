<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SimpleInvoiceController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\DoctorScheduleController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Routes publiques
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/login-with-google', [AuthController::class, 'loginWithGoogle']);

// Routes pour la réinitialisation de mot de passe
Route::post('/forgot-password', [App\Http\Controllers\Auth\ForgotPasswordController::class, 'sendVerificationCode']);
Route::post('/verify-code', [App\Http\Controllers\Auth\ForgotPasswordController::class, 'verifyCode']);
Route::post('/reset-password', [App\Http\Controllers\Auth\ForgotPasswordController::class, 'resetPassword']);

// Route pour le formulaire de contact (accessible publiquement)
Route::post('/contact', [AdminController::class, 'storeContact']);

// Routes publiques pour la vérification de disponibilité des médecins
Route::get('/doctors/{doctorId}/availability', [DoctorController::class, 'getAvailability']);
Route::get('/doctors/{doctorId}/monthly-availability', [DoctorController::class, 'getMonthlyAvailability']);
Route::get('/doctors/{doctorId}/availability-check', [DoctorScheduleController::class, 'checkAvailability']);

// Webhook (non authentifié)
Route::post('/payments/webhook', [PaymentController::class, 'handlePaymentWebhook']);

// Routes protégées par authentification
Route::middleware('auth:sanctum')->group(function () {
    // Route pour récupérer l'utilisateur connecté
    Route::get('/user', [AuthController::class, 'user']);
    
    // Route pour la déconnexion
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Routes pour les patients
    Route::prefix('patient')->group(function () {
        Route::get('/appointments', [PatientController::class, 'getAppointments']);
        Route::post('/appointments', [PatientController::class, 'createAppointment']);
        Route::delete('/appointments/{id}', [PatientController::class, 'cancelAppointment']);
        Route::put('/appointments/{id}', [PatientController::class, 'updateAppointment']);
        Route::get('/medical-records', [PatientController::class, 'getMedicalRecords']);
        Route::get('/medical-records/{id}', [PatientController::class, 'getMedicalRecord']);
        Route::get('/prescriptions', [PatientController::class, 'getPrescriptions']);
        Route::get('/prescriptions/{id}', [PatientController::class, 'getPrescription']);
        Route::get('/prescriptions/{id}/download-pdf', [PatientController::class, 'downloadPrescriptionPdf']);
        Route::get('/profile', [PatientController::class, 'getProfile']);
        Route::put('/profile', [PatientController::class, 'updateProfile']);
        Route::post('/profile/photo', [PatientController::class, 'updateProfilePhoto']);
        Route::get('/documents/{id}/download', [PatientController::class, 'downloadDocument']);
        Route::get('/invoices', [PatientController::class, 'getInvoices']);
        Route::get('/invoices/{id}', [PatientController::class, 'getInvoice']);
        Route::get('/invoices/{id}/download-pdf', [PatientController::class, 'downloadInvoicePdf']);

        // Nouvelles routes pour les paiements
        Route::get('/payment-methods', [PaymentController::class, 'getPaymentMethods']);
        Route::post('/invoices/{id}/payment/initialize', [PaymentController::class, 'initializePayment']);
        Route::post('/payments/process', [PaymentController::class, 'processPayment']);
        
        // Routes pour les services (correctement placées dans le préfixe 'patient')
        Route::get('/services', [ServiceController::class, 'getActiveServices']);
        Route::get('/services/{id}/doctors', [ServiceController::class, 'getDoctors']);
        
        // Route pour récupérer les horaires d'un médecin (pour les patients)
        Route::get('/doctors/{doctor_id}/schedules', [DoctorScheduleController::class, 'getDoctorSchedules']);
    });
    
    // Routes pour les médecins
    Route::prefix('doctor')->group(function () {
        Route::get('/appointments', [DoctorController::class, 'getAppointments']);
        Route::put('/appointments/{id}/status', [DoctorController::class, 'updateAppointmentStatus']);
        Route::get('/patients', [DoctorController::class, 'getPatients']);
        Route::get('/patients/{id}', [DoctorController::class, 'getPatientDetails']);
        Route::post('/medical-records', [DoctorController::class, 'createMedicalRecord']);
        Route::post('/prescriptions', [DoctorController::class, 'createPrescription']);
        Route::get('/medical-records', [DoctorController::class, 'getMedicalRecords']);
        Route::get('/prescriptions', [DoctorController::class, 'getPrescriptions']);
        Route::get('/invoices', [DoctorController::class, 'getInvoices']);
        Route::get('/patients/{id}/invoices', [DoctorController::class, 'getPatientInvoices']);
        Route::get('/documents/{id}/download', [DoctorController::class, 'downloadDocument']);
        Route::get('/profile', [DoctorController::class, 'getProfile']);
        Route::put('/profile', [DoctorController::class, 'updateProfile']);
        Route::post('/profile/photo', [DoctorController::class, 'updateProfilePhoto']);
        
        // Routes pour les horaires de disponibilité des médecins
        Route::get('/schedules', [DoctorScheduleController::class, 'getSchedules']);
        Route::post('/schedules', [DoctorScheduleController::class, 'updateSchedule']);
    });
    
    // Routes pour les admins
    Route::prefix('admin')->group(function () {
        Route::get('/statistics', [AdminController::class, 'getStatistics']);
        Route::get('/patients', [AdminController::class, 'getPatients']);
        Route::post('/patients', [AdminController::class, 'addPatient']);
        Route::put('/patients/{id}', [AdminController::class, 'updatePatient']);
        Route::delete('/patients/{id}', [AdminController::class, 'deletePatient']);
        Route::get('/doctors', [AdminController::class, 'getDoctors']);
        Route::post('/doctors', [AdminController::class, 'addDoctor']);
        Route::put('/doctors/{id}', [AdminController::class, 'updateDoctor']);
        Route::delete('/doctors/{id}', [AdminController::class, 'deleteDoctor']);
        Route::get('/appointments', [AdminController::class, 'getAppointments']);
        Route::post('/appointments', [AdminController::class, 'addAppointment']);
        Route::put('/appointments/{id}', [AdminController::class, 'updateAppointment']);
        Route::delete('/appointments/{id}', [AdminController::class, 'deleteAppointment']);
        Route::get('/medical-records', [AdminController::class, 'getMedicalRecords']);
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::post('/users', [AdminController::class, 'addUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        
        // Routes pour le profil admin
        Route::get('/profile', [AdminController::class, 'getProfile']);
        Route::put('/profile', [AdminController::class, 'updateProfile']);
        Route::post('/profile/photo', [AdminController::class, 'updateProfilePhoto']);
        
        // Routes pour les méthodes de paiement
        Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
        Route::post('/payment-methods', [PaymentMethodController::class, 'store']);
        Route::get('/payment-methods/{id}', [PaymentMethodController::class, 'show']);
        Route::put('/payment-methods/{id}', [PaymentMethodController::class, 'update']);
        Route::delete('/payment-methods/{id}', [PaymentMethodController::class, 'destroy']);
        Route::post('/payment-methods/{id}/set-default', [PaymentMethodController::class, 'setDefault']);
        
        // Routes pour surveiller les paiements
        Route::get('/payments', [PaymentController::class, 'index']);
        
        // Routes pour les messages de contact
        Route::get('/contacts', [AdminController::class, 'getContacts']);
        Route::get('/contacts/{id}', [AdminController::class, 'showContact']);
        Route::put('/contacts/{id}/mark-as-read', [AdminController::class, 'markContactAsRead']);
        Route::delete('/contacts/{id}', [AdminController::class, 'deleteContact']);

        // Routes pour les services
        Route::get('/services', [ServiceController::class, 'index']);
        Route::post('/services', [ServiceController::class, 'store']);
        Route::get('/services/{id}', [ServiceController::class, 'show']);
        Route::put('/services/{id}', [ServiceController::class, 'update']);
        Route::delete('/services/{id}', [ServiceController::class, 'destroy']);
        
        // Routes corrigées pour la gestion des médecins dans les services
        Route::post('/services/{id}/doctors', [ServiceController::class, 'assignDoctor']);
        Route::delete('/services/{id}/doctors', [ServiceController::class, 'removeDoctor']);

        Route::get('/prescriptions', [AdminController::class, 'getAdminPrescriptions']);
        Route::get('/prescriptions/{id}', [AdminController::class, 'getAdminPrescription']);
        Route::post('/prescriptions', [AdminController::class, 'createAdminPrescription']);
        Route::put('/prescriptions/{id}', [AdminController::class, 'editAdminPrescription']);
        Route::delete('/prescriptions/{id}', [AdminController::class, 'removeAdminPrescription']);
    });
    
    // Routes pour les notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'getNotifications']);
        Route::get('/unread', [NotificationController::class, 'getUnreadNotifications']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'delete']);
        Route::delete('/read', [NotificationController::class, 'deleteAllRead']);
        
        // Routes spécifiques à l'admin
        Route::post('/create', [NotificationController::class, 'createNotification']);
        Route::post('/notify-role', [NotificationController::class, 'notifyRole']);
        Route::get('/system', [NotificationController::class, 'getSystemNotifications']);
        Route::get('/user/{userId}', [NotificationController::class, 'getUserNotifications']);
    });

    // Routes pour les médecins (accès public pour les patients)
    Route::get('/doctors', [DoctorController::class, 'getAllDoctors']);
        
    // Routes pour la gestion des factures (version simplifiée)
    Route::get('/invoices', [SimpleInvoiceController::class, 'index']);
    Route::get('/invoices/{id}', [SimpleInvoiceController::class, 'show']);
    Route::post('/invoices', [SimpleInvoiceController::class, 'store']);
    Route::put('/invoices/{id}', [SimpleInvoiceController::class, 'update']);
    Route::delete('/invoices/{id}', [SimpleInvoiceController::class, 'destroy']);
    Route::post('/invoices/{id}/pay', [SimpleInvoiceController::class, 'markAsPaid']);
});