<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'appointment_id',
        'date',
        'type',
        'diagnosis',
        'notes',
    ];

    /**
     * Get the patient that owns the medical record.
     */
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the doctor that created the medical record.
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the appointment associated with the medical record.
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the documents for the medical record.
     */
    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Get the prescription associated with the medical record.
     */
    public function prescription()
    {
        return $this->hasOne(Prescription::class);
    }
}