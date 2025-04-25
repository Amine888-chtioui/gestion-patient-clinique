<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\User;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PDF;

class InvoiceController extends Controller
{
    /**
     * Get all invoices with pagination and filters.
     */
    public function index(Request $request)
    {
        $query = Invoice::with(['patient', 'appointment'])
            ->orderBy('created_at', 'desc');
        
        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }
        
        if ($request->has('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        
        if ($request->has('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhereHas('patient', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }
        
        $invoices = $query->paginate(10);
        
        return response()->json([
            'invoices' => $invoices,
            'unpaid_total' => Invoice::where('status', 'unpaid')->sum('total_amount'),
            'overdue_count' => Invoice::overdue()->count(),
        ]);
    }

    /**
     * Create a new invoice.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:date',
            'tax_percent' => 'required|numeric|min:0|max:100',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string',
            'payment_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // Generate invoice number
            $invoiceNumber = Invoice::generateInvoiceNumber();
            
            // Create invoice
            $invoice = new Invoice([
                'patient_id' => $request->patient_id,
                'appointment_id' => $request->appointment_id,
                'number' => $invoiceNumber,
                'date' => $request->date,
                'due_date' => $request->due_date,
                'tax_percent' => $request->tax_percent,
                'status' => $request->payment_date ? 'paid' : 'draft',
                'payment_method' => $request->payment_method,
                'payment_date' => $request->payment_date,
                'notes' => $request->notes,
            ]);
            
            $invoice->save();
            
            // Create invoice items
            foreach ($request->items as $item) {
                $invoiceItem = new InvoiceItem([
                    'invoice_id' => $invoice->id,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);
                
                $invoiceItem->calculateTotalPrice()->setType()->save();
            }
            
            // Calculate invoice total
            $invoice->calculateTotal()->save();
            
            DB::commit();
            
            return response()->json([
                'message' => 'Facture créée avec succès',
                'invoice' => $invoice->fresh(['items', 'patient']),
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Une erreur est survenue lors de la création de la facture', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get a specific invoice with its items.
     */
    public function show($id)
    {
        $invoice = Invoice::with(['items', 'patient', 'appointment'])->findOrFail($id);
        
        return response()->json(['invoice' => $invoice]);
    }

    /**
     * Update an invoice.
     */
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        
        // Don't allow updating paid invoices
        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'Impossible de modifier une facture déjà payée'], 422);
        }
        
        $validator = Validator::make($request->all(), [
            'patient_id' => 'nullable|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:date',
            'tax_percent' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|in:draft,sent,paid,cancelled',
            'payment_method' => 'nullable|string',
            'payment_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.id' => 'nullable|exists:invoice_items,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // Update invoice data
            if ($request->has('patient_id')) {
                $invoice->patient_id = $request->patient_id;
            }
            
            if ($request->has('appointment_id')) {
                $invoice->appointment_id = $request->appointment_id;
            }
            
            if ($request->has('date')) {
                $invoice->date = $request->date;
            }
            
            if ($request->has('due_date')) {
                $invoice->due_date = $request->due_date;
            }
            
            if ($request->has('tax_percent')) {
                $invoice->tax_percent = $request->tax_percent;
            }
            
            if ($request->has('status')) {
                $invoice->status = $request->status;
                
                if ($request->status === 'paid' && !$invoice->payment_date) {
                    $invoice->payment_date = now();
                }
            }
            
            if ($request->has('payment_method')) {
                $invoice->payment_method = $request->payment_method;
            }
            
            if ($request->has('payment_date')) {
                $invoice->payment_date = $request->payment_date;
                
                if ($request->payment_date && $invoice->status !== 'paid') {
                    $invoice->status = 'paid';
                }
            }
            
            if ($request->has('notes')) {
                $invoice->notes = $request->notes;
            }
            
            // Update or create invoice items
            if ($request->has('items')) {
                // Get existing item IDs
                $existingItemIds = $invoice->items->pluck('id')->toArray();
                $updatedItemIds = [];
                
                foreach ($request->items as $itemData) {
                    if (isset($itemData['id'])) {
                        // Update existing item
                        $item = InvoiceItem::findOrFail($itemData['id']);
                        $item->description = $itemData['description'];
                        $item->quantity = $itemData['quantity'];
                        $item->unit_price = $itemData['unit_price'];
                        $item->calculateTotalPrice()->setType()->save();
                        
                        $updatedItemIds[] = $item->id;
                    } else {
                        // Create new item
                        $item = new InvoiceItem([
                            'invoice_id' => $invoice->id,
                            'description' => $itemData['description'],
                            'quantity' => $itemData['quantity'],
                            'unit_price' => $itemData['unit_price'],
                        ]);
                        
                        $item->calculateTotalPrice()->setType()->save();
                        $updatedItemIds[] = $item->id;
                    }
                }
                
                // Delete items that were not in the update
                $itemsToDelete = array_diff($existingItemIds, $updatedItemIds);
                InvoiceItem::whereIn('id', $itemsToDelete)->delete();
            }
            
            // Recalculate invoice total
            $invoice->calculateTotal()->save();
            
            DB::commit();
            
            return response()->json([
                'message' => 'Facture mise à jour avec succès',
                'invoice' => $invoice->fresh(['items', 'patient']),
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Une erreur est survenue lors de la mise à jour de la facture', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete an invoice.
     */
    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        
        // Don't allow deleting paid invoices
        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'Impossible de supprimer une facture déjà payée'], 422);
        }
        
        $invoice->delete();
        
        return response()->json(['message' => 'Facture supprimée avec succès']);
    }

    /**
     * Mark an invoice as paid.
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
        
        return response()->json([
            'message' => 'Facture marquée comme payée',
            'invoice' => $invoice->fresh(),
        ]);
    }

    /**
     * Send an invoice by email.
     */
    public function sendByEmail($id)
    {
        $invoice = Invoice::with(['items', 'patient'])->findOrFail($id);
        
        if ($invoice->status === 'draft') {
            $invoice->status = 'sent';
            $invoice->save();
        }
        
        // Here you would implement the logic to send an email with the invoice
        // For demonstration purposes, we'll just return a success message
        
        return response()->json(['message' => 'Facture envoyée par email avec succès']);
    }

    /**
     * Generate a PDF for an invoice.
     */
    public function generatePdf($id)
    {
        $invoice = Invoice::with(['items', 'patient', 'appointment'])->findOrFail($id);
        
        // For demonstration purposes, assuming you have a PDF library configured
        // In a real application, you'd use a library like dompdf or mpdf
        
        // Implement PDF generation logic here
        
        return response()->json(['message' => 'PDF généré avec succès', 'invoice_id' => $id]);
    }

    /**
     * Get invoice statistics.
     */
    public function getStatistics()
    {
        $currentMonth = now()->format('m');
        $currentYear = now()->format('Y');
        
        $stats = [
            'total_invoices' => Invoice::count(),
            'paid_invoices' => Invoice::where('status', 'paid')->count(),
            'unpaid_invoices' => Invoice::where('status', 'unpaid')->count(),
            'overdue_invoices' => Invoice::overdue()->count(),
            'total_revenue' => Invoice::where('status', 'paid')->sum('total_amount'),
            'current_month_revenue' => Invoice::where('status', 'paid')
                ->whereYear('payment_date', $currentYear)
                ->whereMonth('payment_date', $currentMonth)
                ->sum('total_amount'),
            'pending_amount' => Invoice::where('status', 'unpaid')->sum('total_amount'),
        ];
        
        // Get monthly revenue for the current year
        $monthlyRevenue = [];
        for ($month = 1; $month <= 12; $month++) {
            $amount = Invoice::where('status', 'paid')
                ->whereYear('payment_date', $currentYear)
                ->whereMonth('payment_date', $month)
                ->sum('total_amount');
            
            $monthlyRevenue[] = [
                'month' => date('F', mktime(0, 0, 0, $month, 10)),
                'amount' => $amount,
            ];
        }
        
        $stats['monthly_revenue'] = $monthlyRevenue;
        
        // Get revenue by service type
        $revenueByType = DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->where('invoices.status', 'paid')
            ->select('invoice_items.type', DB::raw('SUM(invoice_items.total_price) as total'))
            ->groupBy('invoice_items.type')
            ->get();
        
        $stats['revenue_by_type'] = $revenueByType;
        
        return response()->json(['statistics' => $stats]);
    }
}