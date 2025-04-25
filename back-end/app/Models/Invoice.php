<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'appointment_id',
        'number',
        'date',
        'due_date',
        'amount',
        'tax_percent',
        'tax_amount',
        'total_amount',
        'status',
        'payment_method',
        'payment_date',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date' => 'date',
        'due_date' => 'date',
        'payment_date' => 'date',
        'amount' => 'decimal:2',
        'tax_percent' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    /**
     * Get the patient that owns the invoice.
     */
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the appointment associated with the invoice.
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the invoice items for this invoice.
     */
    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    /**
     * Scope a query to only include paid invoices.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope a query to only include unpaid invoices.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeUnpaid($query)
    {
        return $query->where('status', 'unpaid');
    }

    /**
     * Scope a query to only include overdue invoices.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', 'unpaid')
                    ->where('due_date', '<', now());
    }

    /**
     * Calculate the total amount of the invoice.
     */
    public function calculateTotal()
    {
        $amount = $this->items->sum('total_price');
        $taxAmount = $amount * ($this->tax_percent / 100);
        
        $this->amount = $amount;
        $this->tax_amount = $taxAmount;
        $this->total_amount = $amount + $taxAmount;
        
        return $this;
    }

    /**
     * Mark the invoice as paid.
     */
    public function markAsPaid($paymentMethod = null, $paymentDate = null)
    {
        $this->status = 'paid';
        $this->payment_method = $paymentMethod ?? $this->payment_method;
        $this->payment_date = $paymentDate ?? now();
        
        return $this;
    }

    /**
     * Generate a unique invoice number.
     */
    public static function generateInvoiceNumber()
    {
        $prefix = 'INV-';
        $year = date('Y');
        $month = date('m');
        
        $latestInvoice = self::where('number', 'like', "{$prefix}{$year}{$month}%")
            ->orderBy('number', 'desc')
            ->first();
        
        if ($latestInvoice) {
            $lastNumber = (int) substr($latestInvoice->number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . $year . $month . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}