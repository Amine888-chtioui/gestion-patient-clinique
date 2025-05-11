<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Mail\ResetPasswordMail;

class ForgotPasswordController extends Controller
{
    /**
     * Envoyer un email avec un code de vérification pour réinitialiser le mot de passe
     */
    public function sendVerificationCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Adresse e-mail introuvable.',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = $request->email;
        $token = Str::random(6); // Code à 6 caractères
        
        // Supprimer les anciens tokens pour cet email
        DB::table('password_reset_tokens')->where('email', $email)->delete();
        
        // Créer un nouveau token
        DB::table('password_reset_tokens')->insert([
            'email' => $email,
            'token' => $token,
            'created_at' => Carbon::now()
        ]);
        
        // Envoyer l'email avec le code de vérification
        try {
            Mail::to($email)->send(new ResetPasswordMail($token));
            
            return response()->json([
                'message' => 'Un code de vérification a été envoyé à votre adresse e-mail.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de l\'envoi de l\'e-mail.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier le code de vérification
     */
    public function verifyCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Informations incorrectes.',
                'errors' => $validator->errors()
            ], 422);
        }

        $passwordReset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->code)
            ->first();
        
        if (!$passwordReset) {
            return response()->json([
                'message' => 'Code de vérification invalide.'
            ], 422);
        }
        
        // Vérifier si le token n'a pas expiré (1 heure de validité)
        $tokenCreatedAt = Carbon::parse($passwordReset->created_at);
        if (Carbon::now()->diffInMinutes($tokenCreatedAt) > 60) {
            return response()->json([
                'message' => 'Le code de vérification a expiré. Veuillez demander un nouveau code.'
            ], 422);
        }
        
        // Générer un token pour la réinitialisation du mot de passe
        $resetToken = Str::random(60);
        
        // Mettre à jour le token dans la base de données
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->update([
                'token' => $resetToken,
                'created_at' => Carbon::now()
            ]);
        
        return response()->json([
            'message' => 'Code de vérification valide.',
            'reset_token' => $resetToken
        ]);
    }

    /**
     * Réinitialiser le mot de passe
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Informations incorrectes.',
                'errors' => $validator->errors()
            ], 422);
        }

        $passwordReset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();
        
        if (!$passwordReset) {
            return response()->json([
                'message' => 'Ce lien de réinitialisation n\'est pas valide.'
            ], 422);
        }
        
        $tokenCreatedAt = Carbon::parse($passwordReset->created_at);
        if (Carbon::now()->diffInMinutes($tokenCreatedAt) > 60) {
            return response()->json([
                'message' => 'Ce lien de réinitialisation a expiré.'
            ], 422);
        }
        
        // Mettre à jour le mot de passe
        $user = User::where('email', $request->email)->first();
        $user->password = bcrypt($request->password);
        $user->save();
        
        // Supprimer le token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();
        
        return response()->json([
            'message' => 'Votre mot de passe a été réinitialisé avec succès.'
        ]);
    }
}