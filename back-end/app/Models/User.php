<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Check if the user is a patient.
     */
    public function isPatient()
    {
        return $this->role === 'patient';
    }

    /**
     * Check if the user is a doctor.
     */
    public function isDoctor()
    {
        return $this->role === 'doctor';
    }

    /**
     * Check if the user is an admin.
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    /**
     * Get the patient profile associated with the user.
     */
    public function patientProfile()
    {
        return $this->hasOne(PatientProfile::class);
    }

    /**
     * Get the appointments for the patient.
     */
    public function patientAppointments()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    /**
     * Get the appointments for the doctor.
     */
    public function doctorAppointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    /**
     * Get the medical records for the patient.
     */
    public function patientMedicalRecords()
    {
        return $this->hasMany(MedicalRecord::class, 'patient_id');
    }

    /**
     * Get the medical records created by the doctor.
     */
    public function doctorMedicalRecords()
    {
        return $this->hasMany(MedicalRecord::class, 'doctor_id');
    }

    /**
     * Get the prescriptions for the patient.
     */
    public function patientPrescriptions()
    {
        return $this->hasMany(Prescription::class, 'patient_id');
    }

    /**
     * Get the prescriptions created by the doctor.
     */
    public function doctorPrescriptions()
    {
        return $this->hasMany(Prescription::class, 'doctor_id');
    }
    // Ajoutez cette méthode dans le modèle User.php

/**
 * Get the notifications for the user.
 */
public function notifications()
{
    return $this->hasMany(Notification::class);
}
}