<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentMethodController extends Controller
{
    /**
     * Récupérer toutes les méthodes de paiement
     */
    public function index()
    {
        // Vérifier si l'utilisateur est un admin
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $paymentMethods = PaymentMethod::all();
        
        return response()->json([
            'payment_methods' => $paymentMethods
        ]);
    }
    
    /**
     * Récupérer les méthodes de paiement actives (pour les utilisateurs)
     */
    public function getActivePaymentMethods()
    {
        $paymentMethods = PaymentMethod::where('is_active', true)
            ->select('id', 'name', 'code', 'description')
            ->get();
        
        return response()->json([
            'payment_methods' => $paymentMethods
        ]);
    }

    /**
     * Créer une nouvelle méthode de paiement
     */
    public function store(Request $request)
    {
        // Vérifier si l'utilisateur est un admin
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:payment_methods',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'config' => 'nullable|array',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $paymentMethod = PaymentMethod::create($request->all());
        
        // Si cette méthode est définie comme méthode par défaut
        if ($request->input('is_default', false)) {
            $paymentMethod->setAsDefault();
        }
        
        return response()->json([
            'message' => 'Méthode de paiement créée avec succès',
            'payment_method' => $paymentMethod
        ], 201);
    }

    /**
     * Récupérer une méthode de paiement spécifique
     */
    public function show($id)
    {
        // Vérifier si l'utilisateur est un admin
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $paymentMethod = PaymentMethod::findOrFail($id);
        
        return response()->json([
            'payment_method' => $paymentMethod
        ]);
    }

    /**
     * Mettre à jour une méthode de paiement
     */
    public function update(Request $request, $id)
    {
        // Vérifier si l'utilisateur est un admin
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $paymentMethod = PaymentMethod::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|unique:payment_methods,code,' . $id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'config' => 'nullable|array',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $paymentMethod->update($request->all());
        
        // Si cette méthode est définie comme méthode par défaut
        if ($request->input('is_default', false)) {
            $paymentMethod->setAsDefault();
        }
        
        return response()->json([
            'message' => 'Méthode de paiement mise à jour avec succès',
            'payment_method' => $paymentMethod
        ]);
    }

    /**
     * Supprimer une méthode de paiement
     */
    public function destroy($id)
    {
        // Vérifier si l'utilisateur est un admin
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $paymentMethod = PaymentMethod::findOrFail($id);
        
        // Vérifier si cette méthode est utilisée dans des factures
        $hasInvoices = $paymentMethod->invoices()->exists();
        
        if ($hasInvoices) {
            return response()->json([
                'message' => 'Cette méthode de paiement est utilisée dans des factures et ne peut pas être supprimée'
            ], 422);
        }
        
        $paymentMethod->delete();
        
        return response()->json([
            'message' => 'Méthode de paiement supprimée avec succès'
        ]);
    }

    /**
     * Définir une méthode de paiement comme méthode par défaut
     */
    public function setDefault($id)
    {
        // Vérifier si l'utilisateur est un admin
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
        
        $paymentMethod = PaymentMethod::findOrFail($id);
        $paymentMethod->setAsDefault();
        
        return response()->json([
            'message' => 'Méthode de paiement définie comme méthode par défaut',
            'payment_method' => $paymentMethod
        ]);
    }
}