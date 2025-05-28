<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class SimpleInvoiceController extends Controller
{
    /**
     * Récupérer toutes les factures
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Vérifier l'autorisation
            if (!in_array($user->role, ['admin', 'doctor'])) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
            
            // Pour cette démo, créons des factures fictives si aucune n'existe
            $invoices = $this->getOrCreateSampleInvoices();
            
            return response()->json([
                'success' => true,
                'data' => $invoices,
                'message' => 'Factures récupérées avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des factures:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des factures'
            ], 500);
        }
    }

    /**
     * Récupérer une facture spécifique
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            // Vérifier l'autorisation
            if (!in_array($user->role, ['admin', 'doctor', 'patient'])) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
            
            Log::info("Récupération de la facture ID: {$id}");
            
            // Pour cette démo, récupérons les factures fictives
            $invoices = $this->getOrCreateSampleInvoices();
            $invoice = collect($invoices)->firstWhere('id', (int)$id);
            
            if (!$invoice) {
                Log::warning("Facture non trouvée: {$id}");
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }
            
            // Si c'est un patient, vérifier qu'il ne peut voir que ses propres factures
            if ($user->role === 'patient' && $invoice['patient']['id'] !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette facture'
                ], 403);
            }
            
            Log::info("Facture trouvée:", ['invoice_number' => $invoice['number']]);
            
            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Facture récupérée avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de la facture:', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la facture'
            ], 500);
        }
    }

    /**
     * Créer une nouvelle facture
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Vérifier l'autorisation
            if (!in_array($user->role, ['admin', 'doctor'])) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
            
            // Validation des données
            $validator = Validator::make($request->all(), [
                'patient_id' => 'required|exists:users,id',
                'date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:date',
                'items' => 'required|array|min:1',
                'items.*.description' => 'required|string',
                'items.*.quantity' => 'required|numeric|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'tax_percent' => 'nullable|numeric|min:0|max:100',
                'notes' => 'nullable|string',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Pour cette démo, simulons la création d'une facture
            $invoiceNumber = 'INV' . date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
            
            // Calculer les totaux
            $subtotal = 0;
            $items = [];
            
            foreach ($request->items as $item) {
                $quantity = floatval($item['quantity']);
                $unitPrice = floatval($item['unit_price']);
                $total = $quantity * $unitPrice;
                $subtotal += $total;
                
                $items[] = [
                    'description' => $item['description'],
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $total
                ];
            }
            
            $taxPercent = floatval($request->tax_percent ?? 20);
            $taxAmount = $subtotal * ($taxPercent / 100);
            $totalAmount = $subtotal + $taxAmount;
            
            // Récupérer les infos du patient
            $patient = User::find($request->patient_id);
            
            $newInvoice = [
                'id' => rand(1000, 9999),
                'number' => $invoiceNumber,
                'date' => $request->date,
                'due_date' => $request->due_date,
                'patient' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone ?? null,
                    'address' => $patient->address ?? null
                ],
                'items' => $items,
                'subtotal_amount' => $subtotal,
                'tax_percent' => $taxPercent,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'status' => 'draft',
                'payment_method' => null,
                'payment_date' => null,
                'notes' => $request->notes,
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString()
            ];
            
            return response()->json([
                'success' => true,
                'data' => $newInvoice,
                'message' => 'Facture créée avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la facture:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la facture'
            ], 500);
        }
    }

    /**
     * Mettre à jour une facture
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Vérifier l'autorisation
            if (!in_array($user->role, ['admin', 'doctor'])) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
            
            // Pour cette démo, simulons la mise à jour
            return response()->json([
                'success' => true,
                'message' => 'Facture mise à jour avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la facture:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la facture'
            ], 500);
        }
    }

    /**
     * Supprimer une facture
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            // Vérifier l'autorisation
            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
            
            // Pour cette démo, simulons la suppression
            return response()->json([
                'success' => true,
                'message' => 'Facture supprimée avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la facture:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la facture'
            ], 500);
        }
    }

    /**
     * Marquer une facture comme payée
     */
    public function markAsPaid(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Vérifier l'autorisation
            if (!in_array($user->role, ['admin', 'doctor'])) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
            
            // Pour cette démo, simulons le marquage comme payé
            return response()->json([
                'success' => true,
                'message' => 'Facture marquée comme payée'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors du marquage de la facture comme payée:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du marquage de la facture'
            ], 500);
        }
    }

    /**
     * Obtenir ou créer des factures d'exemple pour la démo
     */
    private function getOrCreateSampleInvoices()
    {
        // Récupérer quelques patients pour les factures d'exemple
        $patients = User::where('role', 'patient')->take(3)->get();
        
        if ($patients->isEmpty()) {
            // Créer un patient fictif si aucun n'existe
            $patients = collect([
                (object)[
                    'id' => 1,
                    'name' => 'Patient Demo',
                    'email' => 'patient@demo.com',
                    'phone' => '01 23 45 67 89'
                ]
            ]);
        }
        
        $invoices = [];
        $baseDate = now()->subDays(30);
        
        for ($i = 1; $i <= 8; $i++) {
            $patient = $patients->random();
            $amount = rand(50, 300);
            $taxAmount = $amount * 0.2;
            $totalAmount = $amount + $taxAmount;
            
            $status = ['paid', 'unpaid', 'pending'][rand(0, 2)];
            $paymentDate = $status === 'paid' ? $baseDate->copy()->addDays($i + 5)->format('Y-m-d') : null;
            
            $invoices[] = [
                'id' => $i,
                'number' => 'INV' . date('Y') . str_pad($i, 8, '0', STR_PAD_LEFT),
                'date' => $baseDate->copy()->addDays($i)->format('Y-m-d'),
                'issue_date' => $baseDate->copy()->addDays($i)->format('Y-m-d'),
                'due_date' => $baseDate->copy()->addDays($i + 30)->format('Y-m-d'),
                'patient' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone ?? null,
                    'address' => "123 Rue de la Santé, 75001 Paris"
                ],
                'items' => [
                    [
                        'description' => 'Consultation médicale',
                        'quantity' => 1,
                        'unit_price' => $amount,
                        'total_price' => $amount
                    ]
                ],
                'subtotal_amount' => $amount,
                'tax_percent' => 20,
                'tax_rate' => 20,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'amount' => $totalAmount,
                'status' => $status,
                'payment_method' => $status === 'paid' ? ['card', 'cash', 'transfer'][rand(0, 2)] : null,
                'payment_date' => $paymentDate,
                'notes' => $i % 3 === 0 ? 'Consultation de contrôle annuel' : null,
                'created_at' => $baseDate->copy()->addDays($i)->toISOString(),
                'updated_at' => $baseDate->copy()->addDays($i)->toISOString()
            ];
        }
        
        return $invoices;
    }
}