<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\AdminController;

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
Route::post('/forgot-password', [App\Http\Controllers\Auth\PasswordResetLinkController::class, 'store'])
    ->middleware('guest')
    ->name('password.email');
Route::post('/reset-password', [App\Http\Controllers\Auth\NewPasswordController::class, 'store'])
    ->middleware('guest')
    ->name('password.update');

// Routes publiques pour les disponibilités des médecins
Route::get('/doctors/{doctor_id}/availability', [DoctorController::class, 'getAvailability']);
Route::get('/doctors/{doctor_id}/monthly-availability', [DoctorController::class, 'getMonthlyAvailability']);

// Routes protégées nécessitant une authentification
Route::middleware('auth:sanctum')->group(function () {
    // Route commune pour récupérer les données utilisateur
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Routes pour obtenir la liste des médecins (pour les patients qui prennent RDV)
    Route::get('/doctors', function() {
        // Retourner tous les utilisateurs avec le rôle doctor
        $doctors = \App\Models\User::where('role', 'doctor')->get(['id', 'name', 'email']);
        return response()->json($doctors);
    });
});

// Routes protégées pour les patients
Route::middleware(['auth:sanctum', 'role:patient'])->prefix('patient')->group(function () {
    Route::get('/appointments', [PatientController::class, 'getAppointments']);
    Route::post('/appointments', [PatientController::class, 'createAppointment']);
    Route::put('/appointments/{id}', [PatientController::class, 'updateAppointment']);
    Route::delete('/appointments/{id}', [PatientController::class, 'cancelAppointment']);
    
    Route::get('/medical-records', [PatientController::class, 'getMedicalRecords']);
    Route::get('/medical-records/{id}', [PatientController::class, 'getMedicalRecord']);
    
    Route::get('/prescriptions', [PatientController::class, 'getPrescriptions']);
    Route::get('/prescriptions/{id}', [PatientController::class, 'getPrescription']);
    Route::get('/prescriptions/{id}/download', [PatientController::class, 'downloadPrescription']);
    
    Route::get('/documents/{id}/download', [PatientController::class, 'downloadDocument']);
    
    Route::get('/profile', [PatientController::class, 'getProfile']);
    Route::put('/profile', [PatientController::class, 'updateProfile']);
    Route::post('/profile/photo', [PatientController::class, 'updateProfilePhoto']);
});

// Routes protégées pour les médecins
Route::middleware(['auth:sanctum', 'role:doctor'])->prefix('doctor')->group(function () {
    Route::get('/appointments', [DoctorController::class, 'getAppointments']);
    Route::put('/appointments/{id}', [DoctorController::class, 'updateAppointmentStatus']);
    
    Route::get('/patients', [DoctorController::class, 'getPatients']);
    Route::get('/patients/{id}', [DoctorController::class, 'getPatientDetails']);
    
    Route::post('/medical-records', [DoctorController::class, 'createMedicalRecord']);
    Route::post('/prescriptions', [DoctorController::class, 'createPrescription']);
    
    Route::get('/documents/{id}/download', [DoctorController::class, 'downloadDocument']);
    
    Route::get('/profile', [DoctorController::class, 'getProfile']);
    Route::put('/profile', [DoctorController::class, 'updateProfile']);
});

// Routes protégées pour les administrateurs
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/statistics', [AdminController::class, 'getStatistics']);
    
    // Gestion des patients
    Route::get('/patients', [AdminController::class, 'getPatients']);
    Route::post('/patients', [AdminController::class, 'addPatient']);
    Route::put('/patients/{id}', [AdminController::class, 'updatePatient']);
    Route::delete('/patients/{id}', [AdminController::class, 'deletePatient']);
    
    // Gestion des médecins
    Route::get('/doctors', [AdminController::class, 'getDoctors']);
    Route::post('/doctors', [AdminController::class, 'addDoctor']);
    Route::put('/doctors/{id}', [AdminController::class, 'updateDoctor']);
    Route::delete('/doctors/{id}', [AdminController::class, 'deleteDoctor']);
    
    // Gestion des rendez-vous
    Route::get('/appointments', [AdminController::class, 'getAppointments']);
    Route::post('/appointments', [AdminController::class, 'addAppointment']);
    Route::put('/appointments/{id}', [AdminController::class, 'updateAppointment']);
    Route::delete('/appointments/{id}', [AdminController::class, 'deleteAppointment']);
    
    // Gestion des utilisateurs
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::post('/users', [AdminController::class, 'addUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
});