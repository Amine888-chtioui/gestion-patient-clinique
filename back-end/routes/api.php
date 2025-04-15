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
});

Route::middleware('role:medecin')->group(function () {
    Route::get('/medecin/patients', [MedecinController::class, 'patients']);
    // زيد هنا المسارات ديال الطبيب
});   // 👤 Routes pour les patients
Route::middleware('role:patient')->group(function () {
    Route::get('/patient/rdvs', [PatientController::class, 'mesRendezVous']);
    // زيد هنا المسارات ديال المريض
});

// 👨‍💼 Routes pour les admins
Route::middleware('auth:sanctum')->get('/admin/dashboard', function (Request $request) {
    return response()->json(['message' => 'Welcome to the admin dashboard!']);
});

    // زيد هنا المسارات ديال الأدمن
