<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MedecinController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Routes d'authentification
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Routes de réinitialisation de mot de passe (utilisant les contrôleurs Breeze)
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
Route::post('/reset-password', [NewPasswordController::class, 'store']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Routes pour le tableau de bord patient
    Route::prefix('patient')->group(function () {
        // Routes d'accès aux rendez-vous
        Route::get('/appointments', [PatientController::class, 'getAppointments']);
        Route::post('/appointments', [PatientController::class, 'createAppointment']);
        Route::put('/appointments/{id}', [PatientController::class, 'updateAppointment']);
        Route::delete('/appointments/{id}', [PatientController::class, 'cancelAppointment']);
        
        // Routes d'accès au dossier médical
        Route::get('/medical-records', [PatientController::class, 'getMedicalRecords']);
        Route::get('/medical-records/{id}', [PatientController::class, 'getMedicalRecord']);
        
        // Routes d'accès aux ordonnances
        Route::get('/prescriptions', [PatientController::class, 'getPrescriptions']);
        Route::get('/prescriptions/{id}', [PatientController::class, 'getPrescription']);
        Route::get('/prescriptions/{id}/download', [PatientController::class, 'downloadPrescription']);
        
        // Routes de gestion du profil
        Route::get('/profile', [PatientController::class, 'getProfile']);
        Route::put('/profile', [PatientController::class, 'updateProfile']);
    });
    
    // Routes pour les médecins (protégées par le middleware de rôle)
    Route::prefix('doctor')->middleware('role:doctor')->group(function () {
        // Routes à implémenter ultérieurement
        Route::get('/patients', [MedecinController::class, 'getPatients']);
        Route::get('/appointments', [MedecinController::class, 'getAppointments']);
    });
    
    // Routes pour les administrateurs (protégées par le middleware de rôle)
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        // Routes à implémenter ultérieurement
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::get('/statistics', [AdminController::class, 'getStatistics']);
    });
});