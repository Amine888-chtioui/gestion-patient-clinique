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

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Routes publiques
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

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
        Route::get('/prescriptions/{id}/download', [PatientController::class, 'downloadPrescription']);
        Route::get('/profile', [PatientController::class, 'getProfile']);
        Route::put('/profile', [PatientController::class, 'updateProfile']);
        Route::post('/profile/photo', [PatientController::class, 'updateProfilePhoto']);
        Route::get('/documents/{id}/download', [PatientController::class, 'downloadDocument']);
        Route::get('/invoices', [PatientController::class, 'getInvoices']);
        Route::get('/invoices/{id}', [PatientController::class, 'getInvoice']);
        Route::get('/invoices/{id}/download', [PatientController::class, 'downloadInvoicePdf']);
        // Nouvelles routes pour les paiements
        Route::get('/payment-methods', [PaymentController::class, 'getPaymentMethods']);
        Route::post('/invoices/{id}/payment/initialize', [PaymentController::class, 'initializePayment']);
        Route::post('/payments/process', [PaymentController::class, 'processPayment']);
    });
    
    // Routes pour les médecins
    Route::prefix('doctor')->group(function () {
        Route::get('/appointments', [DoctorController::class, 'getAppointments']);
        Route::put('/appointments/{id}/status', [DoctorController::class, 'updateAppointmentStatus']);
        Route::get('/patients', [DoctorController::class, 'getPatients']);
        Route::get('/patients/{id}', [DoctorController::class, 'getPatientDetails']);
        Route::post('/medical-records', [DoctorController::class, 'createMedicalRecord']);
        Route::post('/prescriptions', [DoctorController::class, 'createPrescription']);
        Route::get('/documents/{id}/download', [DoctorController::class, 'downloadDocument']);
        Route::get('/profile', [DoctorController::class, 'getProfile']);
        Route::put('/profile', [DoctorController::class, 'updateProfile']);
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
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::post('/users', [AdminController::class, 'addUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        
        // Routes pour les méthodes de paiement
        Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
        Route::post('/payment-methods', [PaymentMethodController::class, 'store']);
        Route::get('/payment-methods/{id}', [PaymentMethodController::class, 'show']);
        Route::put('/payment-methods/{id}', [PaymentMethodController::class, 'update']);
        Route::delete('/payment-methods/{id}', [PaymentMethodController::class, 'destroy']);
        Route::post('/payment-methods/{id}/set-default', [PaymentMethodController::class, 'setDefault']);
        
        // Routes pour surveiller les paiements
        Route::get('/payments', [PaymentController::class, 'index']);
    });
    
    // Routes pour les médecins (accès public pour les patients)
    Route::get('/doctors/{doctor_id}/availability', [DoctorController::class, 'getAvailability']);
    Route::get('/doctors/{doctor_id}/monthly-availability', [DoctorController::class, 'getMonthlyAvailability']);
    
    // Routes pour la gestion des factures (version simplifiée)
    Route::get('/invoices', [SimpleInvoiceController::class, 'index']);
    Route::get('/invoices/{id}', [SimpleInvoiceController::class, 'show']);
    Route::post('/invoices', [SimpleInvoiceController::class, 'store']);
    Route::put('/invoices/{id}', [SimpleInvoiceController::class, 'update']);
    Route::delete('/invoices/{id}', [SimpleInvoiceController::class, 'destroy']);
    Route::post('/invoices/{id}/pay', [SimpleInvoiceController::class, 'markAsPaid']);
});