<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'medical_record_id',
        'date',
        'notes',
    ];

    /**
     * Get the patient that owns the prescription.
     */
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the doctor that created the prescription.
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the medical record associated with the prescription.
     */
    public function medicalRecord()
    {
        return $this->belongsTo(MedicalRecord::class);
    }

    /**
     * Get the medications for the prescription.
     */
    public function medications()
    {
        return $this->hasMany(Medication::class);
    }
}