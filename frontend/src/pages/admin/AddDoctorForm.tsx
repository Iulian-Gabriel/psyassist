// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "@/services/api";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

// export default function AddDoctorForm() {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [errorStatusCode, setErrorStatusCode] = useState<number | undefined>(
//     undefined
//   );

//   // Form fields
//   const [formData, setFormData] = useState({
//     // User data
//     email: "",
//     password: "",
//     first_name: "",
//     last_name: "",
//     date_of_birth: "",
//     gender: "unspecified",
//     phone_number: "",
//     address_street: "",
//     address_city: "",
//     address_postal_code: "",
//     address_country: "",
//     address_county: "",

//     // Employee data
//     job_title: "",

//     // Doctor data
//     specialization: "",
//     bio: "",
//   });

//   const handleChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       setLoading(true);
//       setError(null);

//       // Generate a unique phone number if one is provided
//       const uniqueFormData = { ...formData };
//       if (uniqueFormData.phone_number) {
//         // Append a random string to make it unique
//         uniqueFormData.phone_number = `${
//           uniqueFormData.phone_number
//         }-${Math.floor(Math.random() * 10000)}`;
//       } else {
//         // If no phone number is provided, set it to empty string
//         uniqueFormData.phone_number = "";
//       }

//       await api.post("/employees/doctor", uniqueFormData);

//       setSuccess("Doctor created successfully!");

//       // Optionally reset form or navigate
//       setTimeout(() => {
//         navigate("/admin/employees");
//       }, 2000);
//     } catch (err: unknown) {
//       console.error("Failed to create doctor:", err);

//       // Enhanced error extraction
//       let errorMessage = "Failed to create doctor. Please try again.";

//       if (err && typeof err === "object") {
//         if ("response" in err) {
//           const response = (
//             err as {
//               response: { status?: number; data?: { message?: string } };
//             }
//           ).response;
//           setErrorStatusCode(response?.status);

//           // Check for HTTP status codes and provide clearer messages
//           if (response?.status === 409) {
//             errorMessage =
//               response?.data?.message ||
//               "This record already exists. Please check email or phone number for duplicates.";
//           } else if (response?.status === 400) {
//             errorMessage =
//               response?.data?.message ||
//               "Missing required fields or invalid data.";
//           } else {
//             // General error message from server
//             errorMessage = response?.data?.message || errorMessage;
//           }
//         } else if ("message" in err) {
//           errorMessage = (err as Error).message;
//         }
//       }

//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">Add New Doctor</h1>
//         <Button variant="outline" onClick={() => navigate("/admin/employees")}>
//           Back to Employees
//         </Button>
//       </div>

//       {success && (
//         <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
//           <strong className="font-bold">Success!</strong>
//           <span className="block sm:inline"> {success}</span>
//         </div>
//       )}

//       <Card>
//         <CardHeader>
//           <CardTitle>Doctor Information</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Personal Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium">Personal Information</h3>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="first_name">First Name*</Label>
//                     <Input
//                       id="first_name"
//                       name="first_name"
//                       value={formData.first_name}
//                       onChange={handleChange}
//                       required
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="last_name">Last Name*</Label>
//                     <Input
//                       id="last_name"
//                       name="last_name"
//                       value={formData.last_name}
//                       onChange={handleChange}
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <Label htmlFor="email">Email*</Label>
//                   <Input
//                     id="email"
//                     name="email"
//                     type="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="password">Password*</Label>
//                   <Input
//                     id="password"
//                     name="password"
//                     type="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="date_of_birth">Date of Birth*</Label>
//                   <Input
//                     id="date_of_birth"
//                     name="date_of_birth"
//                     type="date"
//                     value={formData.date_of_birth}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="gender">Gender</Label>
//                   <select
//                     id="gender"
//                     name="gender"
//                     value={formData.gender}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                   >
//                     <option value="unspecified">Unspecified</option>
//                     <option value="male">Male</option>
//                     <option value="female">Female</option>
//                   </select>
//                 </div>

//                 <div>
//                   <Label htmlFor="phone_number">Phone Number</Label>
//                   <Input
//                     id="phone_number"
//                     name="phone_number"
//                     value={formData.phone_number}
//                     onChange={handleChange}
//                   />
//                 </div>
//               </div>

//               {/* Address & Employment Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium">Address & Employment</h3>

//                 <div>
//                   <Label htmlFor="address_street">Street Address</Label>
//                   <Input
//                     id="address_street"
//                     name="address_street"
//                     value={formData.address_street}
//                     onChange={handleChange}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="address_city">City</Label>
//                     <Input
//                       id="address_city"
//                       name="address_city"
//                       value={formData.address_city}
//                       onChange={handleChange}
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="address_postal_code">Postal Code</Label>
//                     <Input
//                       id="address_postal_code"
//                       name="address_postal_code"
//                       value={formData.address_postal_code}
//                       onChange={handleChange}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="address_county">County</Label>
//                     <Input
//                       id="address_county"
//                       name="address_county"
//                       value={formData.address_county}
//                       onChange={handleChange}
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="address_country">Country</Label>
//                     <Input
//                       id="address_country"
//                       name="address_country"
//                       value={formData.address_country}
//                       onChange={handleChange}
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <Label htmlFor="job_title">Job Title*</Label>
//                   <Input
//                     id="job_title"
//                     name="job_title"
//                     value={formData.job_title}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="specialization">Specialization</Label>
//                   <Input
//                     id="specialization"
//                     name="specialization"
//                     value={formData.specialization}
//                     onChange={handleChange}
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="bio">Professional Bio</Label>
//                   <Textarea
//                     id="bio"
//                     name="bio"
//                     value={formData.bio}
//                     onChange={handleChange}
//                     rows={4}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="flex justify-end gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => navigate("/admin/employees")}
//               >
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={loading}>
//                 {loading ? "Creating..." : "Create Doctor"}
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>

//       <ApiErrorDisplay error={error} statusCode={errorStatusCode} />
//     </div>
//   );
// }
