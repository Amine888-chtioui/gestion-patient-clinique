<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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
        'photo_path', // Ajout du champ pour le chemin de la photo
    ];

    /**
     * Get the user that owns the patient profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Get the photo URL attribute.
     */
    public function getPhotoUrlAttribute()
    {
        if ($this->photo_path) {
            return Storage::url($this->photo_path);
        }
        
        return null;
    }
}