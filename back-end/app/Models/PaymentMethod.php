<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
        'is_default',
        'config',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'config' => 'array',
    ];

    /**
     * Get all invoices that use this payment method.
     */
    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Set this payment method as the default one.
     */
    public function setAsDefault()
    {
        // First, remove default status from all other methods
        self::where('is_default', true)->update(['is_default' => false]);
        
        // Then set this one as default
        $this->is_default = true;
        $this->save();
        
        return $this;
    }

    /**
     * Get the default payment method.
     */
    public static function getDefault()
    {
        return self::where('is_active', true)
            ->where('is_default', true)
            ->first();
    }
}