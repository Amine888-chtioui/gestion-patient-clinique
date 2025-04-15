<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin
    User::create([
        'name' => 'Admin',
        'email' => 'admin@clinic.com',
        'password' => Hash::make('password'),
        'role' => 'admin',
    ]);

    // Doctor
    User::create([
        'name' => 'Dr. House',
        'email' => 'doctor@clinic.com',
        'password' => Hash::make('password'),
        'role' => 'doctor',
    ]);
    }
}
