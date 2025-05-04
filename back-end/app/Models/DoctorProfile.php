<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorProfile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'phone',
        'specialite',
        'adresse',
        'education',
        'experience',
        'bio',
        'service_id'  // Nouveau champ
    ];

    /**
     * Get the user that owns the doctor profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    /**
     * Get the service associated with the doctor profile.
     */
    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}