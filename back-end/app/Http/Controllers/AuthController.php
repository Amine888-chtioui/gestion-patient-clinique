<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Enregistrer un nouvel utilisateur
     */
    public function register(Request $request)
    {
        try {
            // Validation des données
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Création de l'utilisateur
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role //React
            ]);

            // Création du token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Utilisateur créé avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de l\'inscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Connecter un utilisateur existant
     */
    public function login(Request $request)
    {
        try {
            // Validation des données
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required',
            ]);
    
            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }
    
            // Tentative d'authentification
            if (!Auth::attempt($request->only('email', 'password'))) {
                return response()->json([
                    'message' => 'Email ou mot de passe incorrect'
                ], 401);
            }
    
            // Récupération de l'utilisateur
            $user = Auth::user();
            
            // Suppression des anciens tokens (optionnel)
            $user->tokens()->delete();
            
            // Création d'un nouveau token
            $token = $user->createToken('auth_token')->plainTextToken;
    
            // Retourner معلومات المستخدم مع التوكن والدور ديالو
            return response()->json([
                'user' => $user,
                'token' => $token,
                'role' => $user->role,  // رجعنا الدور ديال المستخدم
                'message' => 'Connexion réussie'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de la connexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function loginWithGoogle(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'google_id' => 'required|string',
            'email' => 'required|email',
            'name' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Chercher l'utilisateur par google_id
            $user = User::where('google_id', $request->google_id)->first();
            
            // Si l'utilisateur n'existe pas, chercher par email
            if (!$user) {
                $user = User::where('email', $request->email)->first();
                
                // Si l'utilisateur existe, mettre à jour son google_id
                if ($user) {
                    $user->update([
                        'google_id' => $request->google_id,
                        'avatar' => $request->avatar ?? null,
                    ]);
                } else {
                    // Créer un nouvel utilisateur
                    $user = User::create([
                        'name' => $request->name,
                        'email' => $request->email,
                        'google_id' => $request->google_id,
                        'avatar' => $request->avatar ?? null,
                        'password' => bcrypt(Str::random(16)),
                        'role' => 'patient', // Rôle par défaut
                    ]);
                }
            }
            
            // Suppression des anciens tokens (optionnel)
            $user->tokens()->delete();
            
            // Création d'un nouveau token
            $token = $user->createToken('auth_token')->plainTextToken;
            
            // Retourner les informations de l'utilisateur avec le token
            return response()->json([
                'user' => $user,
                'token' => $token,
                'role' => $user->role,
                'message' => 'Connexion réussie via Google'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de la connexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    

    /**
     * Récupérer les informations de l'utilisateur connecté
     */
    public function user(Request $request)
    {
        try {
            // Le middleware auth:sanctum garantit que l'utilisateur est authentifié
            return response()->json($request->user());
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de la récupération des données utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Déconnecter l'utilisateur (révoquer le token)
     */
    public function logout(Request $request)
    {
        try {
            // Suppression du token actuel
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Déconnexion réussie'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de la déconnexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}