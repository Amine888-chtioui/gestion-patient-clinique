<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'description',
        'quantity',
        'unit_price',
        'total_price',
        'type',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    /**
     * Get the invoice that owns the invoice item.
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Calculate the total price based on quantity and unit price.
     */
    public function calculateTotalPrice()
    {
        $this->total_price = $this->quantity * $this->unit_price;
        return $this;
    }

    /**
     * Set the type of the invoice item based on the description.
     */
    public function setType()
    {
        // Examples of different types of items
        $consultationKeywords = ['consultation', 'examen', 'visite'];
        $medicationKeywords = ['médicament', 'prescription', 'pharmacie'];
        $testsKeywords = ['analyse', 'test', 'laboratoire', 'échographie', 'radio'];
        $procedureKeywords = ['chirurgie', 'intervention', 'procédure', 'traitement'];
        
        $description = strtolower($this->description);
        
        if ($this->matchKeywords($description, $consultationKeywords)) {
            $this->type = 'consultation';
        } elseif ($this->matchKeywords($description, $medicationKeywords)) {
            $this->type = 'medication';
        } elseif ($this->matchKeywords($description, $testsKeywords)) {
            $this->type = 'test';
        } elseif ($this->matchKeywords($description, $procedureKeywords)) {
            $this->type = 'procedure';
        } else {
            $this->type = 'other';
        }
        
        return $this;
    }

    /**
     * Helper function to check if the description contains any of the keywords.
     */
    private function matchKeywords($description, $keywords)
    {
        foreach ($keywords as $keyword) {
            if (strpos($description, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }
}