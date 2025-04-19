<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'date',
        'time',
        'reason',
        'status',
        'notes',
    ];

    /**
     * Get the patient that owns the appointment.
     */
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the doctor that owns the appointment.
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the medical record associated with the appointment.
     */
    public function medicalRecord()
    {
        return $this->hasOne(MedicalRecord::class);
    }
}