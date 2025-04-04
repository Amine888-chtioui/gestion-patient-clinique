<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // Validate the request data
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Create a new user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);

        // Return a success response
        return response()->json(['message' => 'User registered successfully'], 201);
    }
    public function login(Request $request)
    {
        // Validate the request data
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Attempt to authenticate the user
        if (!auth()->attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Generate a new token for the user
        $token = auth()->user()->createToken('auth_token')->plainTextToken;

        // Return the token in the response
        return response()->json(['token' => $token], 200);
    }
    public function logout(Request $request)
    {
        // Revoke the user's token
        auth()->user()->tokens()->delete();

        // Return a success response
        return response()->json(['message' => 'User logged out successfully'], 200);
    }
    public function getUser(Request $request)
    {
        // Return the authenticated user
        return response()->json($request->user(), 200);
    }
}
