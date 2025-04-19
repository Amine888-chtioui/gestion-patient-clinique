<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'medical_record_id',
        'name',
        'file_path',
        'type',
    ];

    /**
     * Get the medical record that owns the document.
     */
    public function medicalRecord()
    {
        return $this->belongsTo(MedicalRecord::class);
    }
}