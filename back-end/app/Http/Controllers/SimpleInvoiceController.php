<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Invoice;
use App\Models\InvoiceItem;

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
            
            // Récupérer les vraies factures de la base de données
            $invoicesQuery = Invoice::with(['patient', 'items', 'appointment']);
            
            // Si c'est un docteur, limiter aux factures de ses patients
            if ($user->role === 'doctor') {
                // Vous pouvez ajouter une logique pour filtrer selon le docteur
                // $invoicesQuery->whereHas('appointment', function($q) use ($user) {
                //     $q->where('doctor_id', $user->id);
                // });
            }
            
            $invoices = $invoicesQuery->orderBy('created_at', 'desc')->get();
            
            // Transformer les données si nécessaire
            $transformedInvoices = $invoices->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'number' => $invoice->number,
                    'patient' => [
                        'id' => $invoice->patient->id,
                        'name' => $invoice->patient->first_name . ' ' . $invoice->patient->last_name,
                        'email' => $invoice->patient->email,
                    ],
                    'date' => $invoice->date->format('Y-m-d'),
                    'due_date' => $invoice->due_date->format('Y-m-d'),
                    'amount' => $invoice->amount,
                    'tax_amount' => $invoice->tax_amount,
                    'total_amount' => $invoice->total_amount,
                    'tax_percent' => $invoice->tax_percent,
                    'status' => $invoice->status,
                    'payment_method' => $invoice->payment_method,
                    'payment_date' => $invoice->payment_date?->format('Y-m-d'),
                    'notes' => $invoice->notes,
                    'items' => $invoice->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'description' => $item->description,
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'total_price' => $item->total_price,
                        ];
                    }),
                    'created_at' => $invoice->created_at->format('Y-m-d H:i:s'),
                ];
            });
            
            return response()->json([
                'success' => true,
                'invoices' => $transformedInvoices,
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
            
            $invoice = Invoice::with(['patient', 'items', 'appointment'])->find($id);
            
            if (!$invoice) {
                Log::warning("Facture non trouvée: {$id}");
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }
            
            // Si c'est un patient, vérifier qu'il ne peut voir que ses propres factures
            if ($user->role === 'patient' && $invoice->patient_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette facture'
                ], 403);
            }
            
            // Transformer la facture
            $transformedInvoice = [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'patient' => [
                    'id' => $invoice->patient->id,
                    'name' => $invoice->patient->first_name . ' ' . $invoice->patient->last_name,
                    'email' => $invoice->patient->email,
                ],
                'appointment_id' => $invoice->appointment_id,
                'date' => $invoice->date->format('Y-m-d'),
                'due_date' => $invoice->due_date->format('Y-m-d'),
                'amount' => $invoice->amount,
                'tax_amount' => $invoice->tax_amount,
                'total_amount' => $invoice->total_amount,
                'tax_percent' => $invoice->tax_percent,
                'status' => $invoice->status,
                'payment_method' => $invoice->payment_method,
                'payment_date' => $invoice->payment_date?->format('Y-m-d'),
                'notes' => $invoice->notes,
                'items' => $invoice->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'total_price' => $item->total_price,
                    ];
                }),
                'created_at' => $invoice->created_at->format('Y-m-d H:i:s'),
            ];
            
            Log::info("Facture trouvée:", ['invoice_number' => $invoice->number]);
            
            return response()->json([
                'success' => true,
                'invoice' => $transformedInvoice,
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
     * Créer une nouvelle facture - VERSION QUI SAUVEGARDE EN BASE
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
                'appointment_id' => 'nullable|exists:appointments,id',
                'date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:date',
                'items' => 'required|array|min:1',
                'items.*.description' => 'required|string',
                'items.*.quantity' => 'required|numeric|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'tax_percent' => 'nullable|numeric|min:0|max:100',
                'status' => 'nullable|string|in:draft,sent,paid,overdue,cancelled',
                'payment_method' => 'nullable|string',
                'payment_date' => 'nullable|date',
                'notes' => 'nullable|string',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            Log::info('Création d\'une nouvelle facture:', $request->all());
            
            DB::beginTransaction();
            
            try {
                // Générer un numéro de facture unique
                $invoiceNumber = $this->generateInvoiceNumber();
                
                // Calculer les totaux
                $subtotal = 0;
                foreach ($request->items as $item) {
                    $subtotal += floatval($item['quantity']) * floatval($item['unit_price']);
                }
                
                $taxPercent = floatval($request->tax_percent ?? 20);
                $taxAmount = $subtotal * ($taxPercent / 100);
                $totalAmount = $subtotal + $taxAmount;
                
                // Créer la facture
                $invoice = new Invoice([
                    'patient_id' => $request->patient_id,
                    'appointment_id' => $request->appointment_id,
                    'number' => $invoiceNumber,
                    'date' => $request->date,
                    'due_date' => $request->due_date,
                    'amount' => $subtotal,
                    'tax_percent' => $taxPercent,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'status' => $request->status ?? 'draft',
                    'payment_method' => $request->payment_method,
                    'payment_date' => $request->payment_date,
                    'notes' => $request->notes,
                ]);
                
                $invoice->save();
                
                Log::info('Facture créée avec ID:', ['id' => $invoice->id, 'number' => $invoice->number]);
                
                // Créer les éléments de la facture
                foreach ($request->items as $item) {
                    $quantity = floatval($item['quantity']);
                    $unitPrice = floatval($item['unit_price']);
                    $totalPrice = $quantity * $unitPrice;
                    
                    $invoiceItem = new InvoiceItem([
                        'invoice_id' => $invoice->id,
                        'description' => $item['description'],
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'total_price' => $totalPrice,
                    ]);
                    
                    $invoiceItem->save();
                    
                    Log::info('Élément de facture créé:', [
                        'invoice_id' => $invoice->id,
                        'description' => $item['description'],
                        'total_price' => $totalPrice
                    ]);
                }
                
                DB::commit();
                
                // Charger les relations pour la réponse
                $invoice->load(['patient', 'items', 'appointment']);
                
                // Transformer la réponse
                $responseInvoice = [
                    'id' => $invoice->id,
                    'number' => $invoice->number,
                    'patient_id' => $invoice->patient_id,
                    'appointment_id' => $invoice->appointment_id,
                    'date' => $invoice->date->format('Y-m-d'),
                    'due_date' => $invoice->due_date->format('Y-m-d'),
                    'amount' => $invoice->amount,
                    'tax_percent' => $invoice->tax_percent,
                    'tax_amount' => $invoice->tax_amount,
                    'total_amount' => $invoice->total_amount,
                    'status' => $invoice->status,
                    'payment_method' => $invoice->payment_method,
                    'payment_date' => $invoice->payment_date,
                    'notes' => $invoice->notes,
                    'items' => $invoice->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'description' => $item->description,
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'total_price' => $item->total_price,
                        ];
                    }),
                    'patient' => [
                        'id' => $invoice->patient->id,
                        'name' => $invoice->patient->first_name . ' ' . $invoice->patient->last_name,
                        'email' => $invoice->patient->email,
                    ],
                ];
                
                Log::info('Facture créée avec succès:', ['invoice_id' => $invoice->id]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Facture créée avec succès',
                    'invoice' => $responseInvoice
                ], 201);
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la facture:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la facture: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour une facture existante
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Vérifier l'autorisation
            if (!in_array($user->role, ['admin', 'doctor'])) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
            
            $invoice = Invoice::with(['items'])->find($id);
            
            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }
            
            // Validation des données
            $validator = Validator::make($request->all(), [
                'patient_id' => 'required|exists:users,id',
                'appointment_id' => 'nullable|exists:appointments,id',
                'date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:date',
                'items' => 'required|array|min:1',
                'items.*.description' => 'required|string',
                'items.*.quantity' => 'required|numeric|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'tax_percent' => 'nullable|numeric|min:0|max:100',
                'status' => 'nullable|string|in:draft,sent,paid,overdue,cancelled',
                'payment_method' => 'nullable|string',
                'payment_date' => 'nullable|date',
                'notes' => 'nullable|string',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            DB::beginTransaction();
            
            try {
                // Calculer les nouveaux totaux
                $subtotal = 0;
                foreach ($request->items as $item) {
                    $subtotal += floatval($item['quantity']) * floatval($item['unit_price']);
                }
                
                $taxPercent = floatval($request->tax_percent ?? 20);
                $taxAmount = $subtotal * ($taxPercent / 100);
                $totalAmount = $subtotal + $taxAmount;
                
                // Mettre à jour la facture
                $invoice->update([
                    'patient_id' => $request->patient_id,
                    'appointment_id' => $request->appointment_id,
                    'date' => $request->date,
                    'due_date' => $request->due_date,
                    'amount' => $subtotal,
                    'tax_percent' => $taxPercent,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'status' => $request->status ?? $invoice->status,
                    'payment_method' => $request->payment_method,
                    'payment_date' => $request->payment_date,
                    'notes' => $request->notes,
                ]);
                
                // Supprimer les anciens éléments
                $invoice->items()->delete();
                
                // Créer les nouveaux éléments
                foreach ($request->items as $item) {
                    $quantity = floatval($item['quantity']);
                    $unitPrice = floatval($item['unit_price']);
                    $totalPrice = $quantity * $unitPrice;
                    
                    $invoiceItem = new InvoiceItem([
                        'invoice_id' => $invoice->id,
                        'description' => $item['description'],
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'total_price' => $totalPrice,
                    ]);
                    
                    $invoiceItem->save();
                }
                
                DB::commit();
                
                // Recharger la facture avec ses relations
                $invoice->load(['patient', 'items', 'appointment']);
                
                Log::info('Facture mise à jour avec succès:', ['invoice_id' => $invoice->id]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Facture mise à jour avec succès',
                    'invoice' => $invoice
                ]);
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la facture:', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
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
            if (!in_array($user->role, ['admin', 'doctor'])) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
            
            $invoice = Invoice::find($id);
            
            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }
            
            // Ne pas permettre la suppression d'une facture payée
            if ($invoice->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer une facture déjà payée'
                ], 422);
            }
            
            $invoice->delete();
            
            Log::info('Facture supprimée:', ['invoice_id' => $id]);
            
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
            
            $invoice = Invoice::find($id);
            
            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }
            
            if ($invoice->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette facture est déjà marquée comme payée'
                ], 422);
            }
            
            $validator = Validator::make($request->all(), [
                'payment_method' => 'required|string',
                'payment_date' => 'nullable|date',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $invoice->update([
                'status' => 'paid',
                'payment_method' => $request->payment_method,
                'payment_date' => $request->payment_date ?? now(),
            ]);
            
            Log::info('Facture marquée comme payée:', ['invoice_id' => $id]);
            
            return response()->json([
                'success' => true,
                'message' => 'Facture marquée comme payée',
                'invoice' => $invoice->fresh()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors du marquage de la facture comme payée:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du marquage de la facture comme payée'
            ], 500);
        }
    }

    /**
     * Générer un numéro de facture unique
     */
    private function generateInvoiceNumber()
    {
        $year = date('Y');
        $month = date('m');
        
        // Compter le nombre de factures ce mois-ci
        $count = Invoice::whereYear('created_at', $year)
                       ->whereMonth('created_at', $month)
                       ->count() + 1;
        
        return sprintf('INV%s%s%04d', $year, $month, $count);
    }

    /**
     * Récupérer ou créer des factures d'exemple (pour la compatibilité)
     */
    private function getOrCreateSampleInvoices()
    {
        // Cette méthode est conservée pour la compatibilité mais ne sera plus utilisée
        // car maintenant nous utilisons de vraies données de la base
        return [];
    }
}