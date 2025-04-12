// frontend/src/pages/ProfilePage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserProfile } from "../services/userService";
import { UserProfileData } from "../types";
import { Button } from "@/components/ui/button"; // Assuming Button is used for logout
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; // Use Card for layout

export default function ProfilePage() {
  const { user, logout, isLoading: isAuthLoading } = useAuth(); // Get user and logout from context
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true); // Separate loading state for profile fetch
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Only fetch if auth isn't loading and user exists
    if (!isAuthLoading && user?.id) {
      const fetchProfile = async () => {
        setLoading(true); // Start profile fetch loading
        setError("");
        try {
          const data: UserProfileData = await getUserProfile(String(user.id));
          setProfileData(data);
        } catch (err: unknown) {
          let message = "Could not load profile data.";
          if (err instanceof Error) {
            message = err.message;
          }
          console.error("Failed to fetch profile:", message);
          setError(message);
        } finally {
          setLoading(false); // Finish profile fetch loading
        }
      };
      fetchProfile();
    } else if (!isAuthLoading && !user?.id) {
      // Handle case where auth is loaded but user is null (shouldn't happen on protected route)
      setError("User authentication data not available.");
      setLoading(false);
    }
    // If isAuthLoading is true, we wait for the next effect run when it becomes false
  }, [user, isAuthLoading]); // Depend on user object and auth loading state

  // Show loading state (either auth loading or profile loading)
  if (isAuthLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading profile...</div> {/* Replace with a spinner if desired */}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message if profile data couldn't be loaded for some reason
  if (!profileData) {
    return <div className="container mx-auto p-4">No profile data found.</div>;
  }

  // Format date nicely
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      // Handle potential ISO string with time or just date
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      // <-- Simply omit the (e) binding
      return "Invalid Date";
    }
  };

  // Display profile data using Card component
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-2xl">
      {" "}
      {/* Constrain width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">User Profile</CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {" "}
          {/* Add spacing between items */}
          <p>
            <strong>ID:</strong> {profileData.user_id}
          </p>
          <p>
            <strong>Email:</strong> {profileData.email}
          </p>
          <p>
            <strong>First Name:</strong> {profileData.first_name}
          </p>
          <p>
            <strong>Last Name:</strong> {profileData.last_name}
          </p>
          <p>
            <strong>Date of Birth:</strong>{" "}
            {formatDate(profileData.date_of_birth)}
          </p>
          {/* Conditionally display optional fields */}
          {profileData.gender && (
            <p>
              <strong>Gender:</strong> {profileData.gender}
            </p>
          )}
          {profileData.phone_number && (
            <p>
              <strong>Phone:</strong> {profileData.phone_number}
            </p>
          )}
          {profileData.address_street && (
            <p>
              <strong>Street:</strong> {profileData.address_street}
            </p>
          )}
          {profileData.address_city && (
            <p>
              <strong>City:</strong> {profileData.address_city}
            </p>
          )}
          {profileData.address_postal_code && (
            <p>
              <strong>Postal Code:</strong> {profileData.address_postal_code}
            </p>
          )}
          {profileData.address_county && (
            <p>
              <strong>County:</strong> {profileData.address_county}
            </p>
          )}
          {profileData.address_country && (
            <p>
              <strong>Country:</strong> {profileData.address_country}
            </p>
          )}
          <p>
            <strong>Member Since:</strong> {formatDate(profileData.created_at)}
          </p>
          <p>
            <strong>Last Updated:</strong> {formatDate(profileData.updated_at)}
          </p>
          <Button
            onClick={logout}
            variant="destructive"
            className="mt-6 w-full sm:w-auto"
          >
            {" "}
            {/* Responsive width */}
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
