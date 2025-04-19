<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medication extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id',
        'name',
        'dosage',
        'frequency',
        'duration',
        'instructions',
    ];

    /**
     * Get the prescription that owns the medication.
     */
    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }
}