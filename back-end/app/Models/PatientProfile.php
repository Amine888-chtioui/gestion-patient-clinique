<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'phone',
        'address',
        'date_of_birth',
        'blood_type',
        'allergies',
        'chronic_diseases',
        'emergency_contact',
        'medical_history',
    ];

    /**
     * Get the user that owns the patient profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}