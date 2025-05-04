<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ServiceController extends Controller
{
    /**
     * Récupérer tous les services
     */
    public function index()
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $services = Service::withCount('doctors')->get();
        
        return response()->json([
            'services' => $services
        ]);
    }
    
    /**
     * Créer un nouveau service
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $service = Service::create($request->all());
        
        return response()->json([
            'message' => 'Service créé avec succès',
            'service' => $service
        ], 201);
    }
    
    /**
     * Récupérer un service spécifique
     */
    public function show($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $service = Service::with(['doctors.user:id,name,email'])->findOrFail($id);
        
        return response()->json([
            'service' => $service
        ]);
    }
    
    /**
     * Mettre à jour un service existant
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $service = Service::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $service->update($request->all());
        
        return response()->json([
            'message' => 'Service mis à jour avec succès',
            'service' => $service
        ]);
    }
    
    /**
     * Supprimer un service
     */
    public function destroy($id)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $service = Service::findOrFail($id);
        
        // Mettre à null le service_id pour tous les docteurs associés
        DoctorProfile::where('service_id', $id)->update(['service_id' => null]);
        
        $service->delete();
        
        return response()->json([
            'message' => 'Service supprimé avec succès'
        ]);
    }
    
    /**
     * Assigner un médecin à un service
     */
    public function assignDoctor(Request $request, $serviceId)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'doctor_id' => 'required|exists:users,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $service = Service::findOrFail($serviceId);
        $doctor = User::where('id', $request->doctor_id)
                      ->where('role', 'doctor')
                      ->firstOrFail();
        
        // Récupérer ou créer le profil du médecin
        $doctorProfile = DoctorProfile::firstOrNew(['user_id' => $doctor->id]);
        $doctorProfile->service_id = $serviceId;
        $doctor->doctorProfile()->save($doctorProfile);
        
        return response()->json([
            'message' => 'Médecin assigné au service avec succès'
        ]);
    }
    
    /**
     * Retirer un médecin d'un service
     */
    public function removeDoctor(Request $request, $serviceId)
    {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est un administrateur
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'doctor_id' => 'required|exists:users,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Vérifier que le service existe
        Service::findOrFail($serviceId);
        
        // Mettre à jour le profil du médecin
        DoctorProfile::where('user_id', $request->doctor_id)
                      ->where('service_id', $serviceId)
                      ->update(['service_id' => null]);
        
        return response()->json([
            'message' => 'Médecin retiré du service avec succès'
        ]);
    }
}