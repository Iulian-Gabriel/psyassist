// frontend/src/pages/ProfilePage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "@/services/userService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Cake,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Edit,
  KeyRound,
  Venus,
  Mars,
  Ban,
} from "lucide-react";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

interface UserProfileData {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  address_street: string | null;
  address_city: string | null;
  address_postal_code: string | null;
  address_county: string | null;
  address_country: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [editableProfileData, setEditableProfileData] = useState<
    Partial<UserProfileData>
  >({});
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user?.id) {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const data = await getUserProfile(String(user.id));
          setProfileData(data);
          setEditableProfileData(data);
        } catch (err: any) {
          setError(err.message || "Could not load profile data.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else if (!isAuthLoading && !user?.id) {
      setError("User authentication data not available.");
      setLoading(false);
    }
  }, [user, isAuthLoading]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditableProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const updatedProfile = await updateUserProfile(editableProfileData);
      setProfileData(updatedProfile);
      setSuccess("Profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      setSuccess("Password changed successfully!");
      setIsPasswordModalOpen(false);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGenderIcon = (gender: string | null | undefined) => {
    if (gender === "male") return <Mars className="h-5 w-5 text-blue-500" />;
    if (gender === "female") return <Venus className="h-5 w-5 text-pink-500" />;
    return <Ban className="h-5 w-5 text-gray-400" />;
  };

  if (isAuthLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading profile...
      </div>
    );
  }

  if (!profileData) {
    return <div className="container mx-auto p-4">No profile data found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <div className="flex gap-2">
            <Dialog
              open={isPasswordModalOpen}
              onOpenChange={setIsPasswordModalOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <KeyRound className="mr-2 h-4 w-4" /> Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Your Password</DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePasswordUpdate}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">Old Password</Label>
                      <Input
                        id="oldPassword"
                        name="oldPassword"
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type="password"
                        value={passwordData.confirmNewPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={logout} variant="destructive">
              Logout
            </Button>
          </div>
        </div>

        {error && <ApiErrorDisplay error={error} className="mb-4" />}
        {success && (
          <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your personal details.</CardDescription>
              </div>
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Make changes to your profile here. Click save when you're
                      done.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleProfileUpdate}>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={editableProfileData.first_name || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={editableProfileData.last_name || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={editableProfileData.email || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={
                            editableProfileData.date_of_birth
                              ? editableProfileData.date_of_birth.split("T")[0]
                              : ""
                          }
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          name="gender"
                          value={editableProfileData.gender || ""}
                          onValueChange={(value) =>
                            handleSelectChange("gender", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="unspecified">
                              Prefer not to say
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          name="phone_number"
                          value={editableProfileData.phone_number || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="address_street">Street</Label>
                        <Input
                          id="address_street"
                          name="address_street"
                          value={editableProfileData.address_street || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_city">City</Label>
                        <Input
                          id="address_city"
                          name="address_city"
                          value={editableProfileData.address_city || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_postal_code">Postal Code</Label>
                        <Input
                          id="address_postal_code"
                          name="address_postal_code"
                          value={editableProfileData.address_postal_code || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_county">County</Label>
                        <Input
                          id="address_county"
                          name="address_county"
                          value={editableProfileData.address_county || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_country">Country</Label>
                        <Input
                          id="address_country"
                          name="address_country"
                          value={editableProfileData.address_country || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-gray-500" />
                <span>
                  {profileData.first_name} {profileData.last_name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-gray-500" />
                <span>{profileData.email}</span>
              </div>
              <div className="flex items-center gap-4">
                <Cake className="h-5 w-5 text-gray-500" />
                <span>{formatDate(profileData.date_of_birth)}</span>
              </div>
              <div className="flex items-center gap-4">
                {getGenderIcon(profileData.gender)}
                <span>{profileData.gender || "Not specified"}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact & Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span>{profileData.phone_number || "N/A"}</span>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p>{profileData.address_street || "No street address"}</p>
                    <p>
                      {profileData.address_city}, {profileData.address_county}{" "}
                      {profileData.address_postal_code}
                    </p>
                    <p>{profileData.address_country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>
                    Member Since: {formatDate(profileData.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span>
                    Last Updated: {formatDate(profileData.updated_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
