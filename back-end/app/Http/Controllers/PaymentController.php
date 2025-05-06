<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Récupérer les méthodes de paiement disponibles
     */
    public function getPaymentMethods()
    {
        $paymentMethods = PaymentMethod::where('is_active', true)
            ->select('id', 'name', 'code', 'description')
            ->get();
        
        return response()->json([
            'payment_methods' => $paymentMethods
        ]);
    }

    /**
     * Initialiser le processus de paiement
     */
    public function initializePayment(Request $request, $invoiceId)
    {
        $user = Auth::user();
        
        // Validation de base
        $validator = Validator::make($request->all(), [
            'payment_method_id' => 'required|exists:payment_methods,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Récupérer la facture
        $invoice = Invoice::where('id', $invoiceId)
            ->where(function($query) use ($user) {
                // Si l'utilisateur est un admin, il peut payer n'importe quelle facture
                // Sinon, il ne peut payer que ses propres factures
                if (!$user->isAdmin()) {
                    $query->where('patient_id', $user->id);
                }
            })
            ->first();
        
        if (!$invoice) {
            return response()->json(['message' => 'Facture non trouvée'], 404);
        }
        
        // Vérifier si la facture est déjà payée
        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'Cette facture est déjà payée'], 422);
        }
        
        $paymentMethodId = $request->input('payment_method_id');
        $paymentMethod = PaymentMethod::findOrFail($paymentMethodId);
        
        // Dans une vraie implémentation, ici on initialiserait le processus de paiement
        // avec un prestataire de paiement (Stripe, PayPal, etc.)
        // Pour cette démonstration, nous simulons simplement un paiement réussi
        
        // Créer une session de paiement fictive
        $paymentSession = [
            'id' => uniqid('pay_'),
            'invoice_id' => $invoice->id,
            'payment_method_id' => $paymentMethodId,
            'amount' => $invoice->total_amount,
            'status' => 'initialized',
            'created_at' => now()->toIso8601String(),
        ];
        
        return response()->json([
            'message' => 'Paiement initialisé',
            'payment_session' => $paymentSession,
            'redirect_url' => '/payment-gateway?session=' . $paymentSession['id'] // URL fictive
        ]);
    }

    /**
     * Finaliser un paiement (simulé)
     */
    public function processPayment(Request $request)
    {
        $user = Auth::user();
        
        // Validation de base
        $validator = Validator::make($request->all(), [
            'invoice_id' => 'required|exists:invoices,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'payment_session_id' => 'required|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Récupérer la facture
        $invoiceId = $request->input('invoice_id');
        $invoice = Invoice::where('id', $invoiceId)
            ->where(function($query) use ($user) {
                // Si l'utilisateur est un admin, il peut payer n'importe quelle facture
                // Sinon, il ne peut payer que ses propres factures
                if (!$user->isAdmin()) {
                    $query->where('patient_id', $user->id);
                }
            })
            ->first();
        
        if (!$invoice) {
            return response()->json(['message' => 'Facture non trouvée'], 404);
        }
        
        // Vérifier si la facture est déjà payée
        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'Cette facture est déjà payée'], 422);
        }
        
        // Traiter le paiement
        $paymentMethodId = $request->input('payment_method_id');
        
        try {
            // Simuler un traitement de paiement réussi
            $invoice->processPayment($paymentMethodId);
            
            // Envoyer une notification au patient
            $this->notificationService->sendInvoiceNotification(
                $invoice->patient,
                [
                    'id' => $invoice->id,
                    'number' => $invoice->number,
                    'amount' => $invoice->total_amount,
                    'due_date' => $invoice->due_date
                ],
                'paid'
            );
            
            return response()->json([
                'message' => 'Paiement traité avec succès',
                'invoice' => [
                    'id' => $invoice->id,
                    'number' => $invoice->number,
                    'status' => $invoice->status,
                    'payment_date' => $invoice->payment_date->format('Y-m-d'),
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du traitement du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Traitement d'un webhook de paiement (simulé)
     */
    public function handlePaymentWebhook(Request $request)
    {
        // Dans une implémentation réelle, cette méthode serait utilisée pour 
        // traiter les notifications asynchrones des plateformes de paiement
        
        // Validation simplifiée des données du webhook
        $validator = Validator::make($request->all(), [
            'event_type' => 'required|string',
            'payment_id' => 'required|string',
            'invoice_id' => 'required',
            'status' => 'required|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Données webhook invalides',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $invoiceId = $request->input('invoice_id');
        $status = $request->input('status');
        
        try {
            $invoice = Invoice::findOrFail($invoiceId);
            
            if ($status === 'completed') {
                $invoice->status = 'paid';
                $invoice->payment_date = now();
                $invoice->save();
                
                // Envoyer une notification au patient
                $this->notificationService->sendInvoiceNotification(
                    $invoice->patient,
                    [
                        'id' => $invoice->id,
                        'number' => $invoice->number,
                        'amount' => $invoice->total_amount,
                        'due_date' => $invoice->due_date
                    ],
                    'paid'
                );
            } elseif ($status === 'failed') {
                // Gestion des échecs de paiement...
                $this->notificationService->sendNotification(
                    $invoice->patient,
                    'Échec de paiement',
                    "Votre tentative de paiement pour la facture {$invoice->number} a échoué. Veuillez réessayer ultérieurement.",
                    'error',
                    '/patient-invoices/' . $invoice->id
                );
            }
            
            return response()->json(['message' => 'Webhook traité avec succès']);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du traitement du webhook',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}