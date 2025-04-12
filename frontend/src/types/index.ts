// frontend/src/types/index.ts

// Data structure for the login form/API call
export interface LoginCredentials {
  email: string;
  password: string;
}

// Data structure for the registration form (camelCase from frontend)
export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: string; // Keep as string (YYYY-MM-DD) from date input
  // Add other optional fields from your form if applicable (gender, phone_number, etc.)
}

// Data structure for user object stored in context/local storage
// Matches the 'user' object returned by backend login/register
export interface User {
  id: number; // Or string, match your backend user_id type
  email: string;
  firstName: string; // Corresponds to first_name from backend
  lastName: string; // Corresponds to last_name from backend
  roles: string[]; // Add this line
}

// Data structure for the full user profile from the API (snake_case)
// Matches the structure returned by backend getUserProfile
export interface UserProfileData {
  user_id: number; // or string
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO string from backend
  gender?: string | null; // Allow null if optional in DB
  phone_number?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
  address_county?: string | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// Structure returned by login/register API calls in authService
export interface AuthResponse {
  accessToken: string;
  user: User; // Use the User interface defined above
}

// Structure for expected API error responses (customize if needed)
export interface ApiErrorData {
  message: string;
  // code?: string;
  // details?: any; // Avoid 'any' if possible, define specific details structure
}
