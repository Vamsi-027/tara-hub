typescriptreact
"use client"

import { signIn } from "next-auth/react"

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Admin Login</h2>
        <p className="text-center text-gray-600">
          {/* Placeholder for login form */}
          [Login form goes here]
        </p>
        {/* You'll add your login form elements here later */}
        {/* For example: */}
        {/* <input type="email" placeholder="Email" /> */}
        {/* <input type="password" placeholder="Password" /> */}
        {/* <button onClick={() => signIn()}>Sign In</button> */}
      </div>
    </div>
  )
}