<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;

class SimpleInvoiceController extends Controller
{
    protected $notificationService;

    /**
     * Créer une nouvelle instance du contrôleur.
     *
     * @param  \App\Services\NotificationService  $notificationService
     * @return void
     */
    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Récupérer la liste des factures
     */
    public function index(Request $request)
    {
        // Filtres de base : status et patient_id
        $query = Invoice::query();
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }
        
        $invoices = $query->with('patient:id,name,email')
                         ->orderBy('created_at', 'desc')
                         ->get();
                         
        return response()->json([
            'success' => true,
            'data' => $invoices
        ]);
    }
    
    /**
     * Récupérer les détails d'une facture
     */
    public function show($id)
    {
        $invoice = Invoice::with(['items', 'patient:id,name,email'])
                         ->findOrFail($id);
                         
        return response()->json([
            'success' => true,
            'data' => $invoice
        ]);
    }
    
    /**
     * Créer une nouvelle facture
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:date',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // Générer le numéro de facture (format simple: INVYYYYMMXXX)
            $year = date('Y');
            $month = date('m');
            $count = Invoice::whereYear('created_at', $year)
                           ->whereMonth('created_at', $month)
                           ->count() + 1;
            $invoiceNumber = "INV{$year}{$month}" . str_pad($count, 3, '0', STR_PAD_LEFT);
            
            // Créer la facture
            $invoice = new Invoice();
            $invoice->patient_id = $request->patient_id;
            $invoice->number = $invoiceNumber;
            $invoice->date = $request->date;
            $invoice->due_date = $request->due_date;
            $invoice->status = 'pending'; // par défaut: en attente
            $invoice->notes = $request->notes ?? null;
            
            // Calculer les totaux
            $subtotal = 0;
            
            // Enregistrer la facture
            $invoice->save();
            
            // Ajouter les éléments de la facture
            foreach ($request->items as $item) {
                $invoiceItem = new InvoiceItem();
                $invoiceItem->invoice_id = $invoice->id;
                $invoiceItem->description = $item['description'];
                $invoiceItem->quantity = $item['quantity'];
                $invoiceItem->unit_price = $item['unit_price'];
                $invoiceItem->total_price = $item['quantity'] * $item['unit_price'];
                $invoiceItem->save();
                
                $subtotal += $invoiceItem->total_price;
            }
            
            // Appliquer TVA (20% par défaut)
            $taxRate = 0.20;
            $taxAmount = $subtotal * $taxRate;
            $total = $subtotal + $taxAmount;
            
            // Mettre à jour les totaux de la facture
            $invoice->amount = $subtotal;
            $invoice->tax_percent = $taxRate * 100;
            $invoice->tax_amount = $taxAmount;
            $invoice->total_amount = $total;
            $invoice->save();
            
            DB::commit();
            
            // Récupérer la facture avec ses relations
            $invoice = Invoice::with(['items', 'patient'])->find($invoice->id);
            
            // Envoyer une notification au patient
            $this->notificationService->sendInvoiceNotification(
                $invoice->patient,
                [
                    'id' => $invoice->id,
                    'number' => $invoice->number,
                    'amount' => $invoice->total_amount,
                    'due_date' => $invoice->due_date
                ],
                'created'
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Invoice created successfully',
                'data' => $invoice
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Mettre à jour une facture
     */
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        
        // Ne pas permettre la modification d'une facture payée
        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify a paid invoice'
            ], 400);
        }
        
        $validator = Validator::make($request->all(), [
            'date' => 'sometimes|date',
            'due_date' => 'sometimes|date|after_or_equal:date',
            'notes' => 'sometimes|nullable|string',
            'items' => 'sometimes|array|min:1',
            'items.*.id' => 'sometimes|exists:invoice_items,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // Mettre à jour les champs de base
            if ($request->has('date')) {
                $invoice->date = $request->date;
            }
            
            if ($request->has('due_date')) {
                $invoice->due_date = $request->due_date;
            }
            
            if ($request->has('notes')) {
                $invoice->notes = $request->notes;
            }
            
            // Mettre à jour les éléments si fournis
            if ($request->has('items')) {
                // Supprimer tous les éléments actuels (pour simplifier)
                $invoice->items()->delete();
                
                // Ajouter les nouveaux éléments
                $subtotal = 0;
                
                foreach ($request->items as $item) {
                    $invoiceItem = new InvoiceItem();
                    $invoiceItem->invoice_id = $invoice->id;
                    $invoiceItem->description = $item['description'];
                    $invoiceItem->quantity = $item['quantity'];
                    $invoiceItem->unit_price = $item['unit_price'];
                    $invoiceItem->total_price = $item['quantity'] * $item['unit_price'];
                    $invoiceItem->save();
                    
                    $subtotal += $invoiceItem->total_price;
                }
                
                // Recalculer les totaux
                $taxRate = 0.20;
                $taxAmount = $subtotal * $taxRate;
                $total = $subtotal + $taxAmount;
                
                $invoice->amount = $subtotal;
                $invoice->tax_amount = $taxAmount;
                $invoice->total_amount = $total;
            }
            
            $invoice->save();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Invoice updated successfully',
                'data' => Invoice::with(['items', 'patient:id,name,email'])->find($invoice->id)
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Supprimer une facture
     */
    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        
        // Ne pas permettre la suppression d'une facture payée
        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a paid invoice'
            ], 400);
        }
        
        try {
            // Supprimer les éléments liés
            $invoice->items()->delete();
            
            // Supprimer la facture
            $invoice->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Invoice deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Marquer une facture comme payée
     */
    public function markAsPaid(Request $request, $id)
{
    $invoice = Invoice::findOrFail($id);
    
    if ($invoice->status === 'paid') {
        return response()->json(['message' => 'Cette facture est déjà marquée comme payée'], 422);
    }
    
    $validator = Validator::make($request->all(), [
        'payment_method' => 'required|string',
        'payment_date' => 'nullable|date',
    ]);
    
    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }
    
    $invoice->markAsPaid($request->payment_method, $request->payment_date)->save();
    
    // Charger la relation patient
    $invoice->load('patient');
    
    // Envoyer une notification au patient
    $notificationService = app(NotificationService::class);
    $notificationService->sendInvoiceNotification(
        $invoice->patient,
        [
            'id' => $invoice->id,
            'number' => $invoice->number,
            'amount' => $invoice->total_amount,
            'due_date' => $invoice->due_date
        ],
        'paid'
    );
    
    // NOUVEAU: Envoyer une notification aux administrateurs
    $admins = User::where('role', 'admin')->get();
    foreach ($admins as $admin) {
        $notificationService->sendNotification(
            $admin,
            'Facture marquée comme payée',
            "La facture {$invoice->number} de {$invoice->patient->name} a été marquée comme payée ({$invoice->total_amount}€)",
            'success',
            '/admin/dashboard/invoices'
        );
    }
    
    return response()->json([
        'message' => 'Facture marquée comme payée',
        'invoice' => $invoice->fresh(),
    ]);
}
}