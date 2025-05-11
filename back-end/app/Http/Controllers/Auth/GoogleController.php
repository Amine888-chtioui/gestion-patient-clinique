<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;


class GoogleController extends Controller
{
    /**
     * Rediriger l'utilisateur vers l'authentification Google.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtenir les informations utilisateur de Google.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            // Chercher l'utilisateur par google_id
            $user = User::where('google_id', $googleUser->id)->first();
            
            // Si l'utilisateur n'existe pas, chercher par email
            if (!$user) {
                $user = User::where('email', $googleUser->email)->first();
                
                // Si l'utilisateur existe, mettre à jour son google_id
                if ($user) {
                    $user->update([
                        'google_id' => $googleUser->id,
                        'avatar' => $googleUser->avatar,
                    ]);
                } else {
                    // Créer un nouvel utilisateur
                    $user = User::create([
                        'name' => $googleUser->name,
                        'email' => $googleUser->email,
                        'google_id' => $googleUser->id,
                        'password' => bcrypt(Str::random(16)),
                        'role' => 'patient', // Rôle par défaut
                    ]);
                }
            }
            
            // Connexion de l'utilisateur
            Auth::login($user);
            
            // Génération d'un token Sanctum pour l'API
            $token = $user->createToken('auth_token')->plainTextToken;
            
            // Redirection vers le frontend avec le token
            return redirect()->away(config('app.frontend_url') . '/auth/callback?token=' . $token . '&role=' . $user->role);
            
        } catch (\Exception $e) {
            // En cas d'erreur, rediriger vers la page de connexion
            return redirect()->away(config('app.frontend_url') . '/login?error=google_auth_failed');
        }
    }
}