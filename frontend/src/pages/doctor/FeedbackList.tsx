import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import ApiErrorDisplay from "../../components/ui/ApiErrorDisplay";
import {
  MessageSquare,
  Star,
  Calendar,
  AlertCircle,
  MessagesSquare,
  CheckCircle2, // For displaying true booleans
} from "lucide-react";

enum FeedbackTargetType {
  DOCTOR = "DOCTOR",
  SERVICE = "SERVICE", // In your schema, SERVICE is used for clinic/general service feedback
}

// Define only the four specified clinic feedback attributes for display purposes
const CLINIC_DISPLAY_ATTRIBUTES = [
  { label: "Clean Facilities", field: "is_clean_facilities" },
  { label: "Friendly Staff", field: "is_friendly_staff" },
  { label: "Easy Accessibility", field: "is_easy_accessibility" },
  { label: "Smooth Admin Process", field: "is_smooth_admin_process" },
];

interface FeedbackItem {
  feedback_id: number;
  service_id: number | null;
  participant_id: number | null;
  rating_score: number | null;
  comments: string | null;
  submission_date: string;
  is_anonymous: boolean;
  target_type: FeedbackTargetType;
  // NEW: Include only these four boolean fields
  is_clean_facilities?: boolean | null;
  is_friendly_staff?: boolean | null;
  is_easy_accessibility?: boolean | null;
  is_smooth_admin_process?: boolean | null;

  service?: {
    service_type: string;
    start_time: string;
    end_time: string;
  } | null;
  serviceParticipant?: {
    patient: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  } | null;
}

interface FeedbackListProps {
  isAdmin?: boolean;
}

export default function FeedbackList({ isAdmin = false }) {
  const { user } = useAuth();

  // Auto-detect admin role if not explicitly set
  const isActuallyAdmin = isAdmin || user?.roles?.includes("admin");

  const [loading, setLoading] = useState(true);
  const [allFeedback, setAllFeedback] = useState<FeedbackItem[]>([]); // For holding all data
  const [doctorFeedback, setDoctorFeedback] = useState<FeedbackItem[]>([]); // Specifically for doctor view
  const [clinicFeedback, setClinicFeedback] = useState<FeedbackItem[]>([]); // For the admin's clinic tab
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      // DEBUG: 1. Check if the effect is running and who the user is
      console.log("=== FEEDBACKLIST DEBUG START ===");
      console.log(
        `[FeedbackList] Starting fetch. Is Admin: ${isActuallyAdmin}, User ID: ${user?.id}`
      );
      console.log(`[FeedbackList] User object:`, user);

      try {
        setLoading(true);
        setError(null);

        if (isActuallyAdmin) {
          // Admin gets everything from the main endpoint
          console.log("[FeedbackList] Admin branch - calling /feedback");
          const response = await api.get("/feedback");

          // DEBUG: Log the response
          console.log(
            "[FeedbackList] Admin API Response status:",
            response.status
          );
          console.log("[FeedbackList] Admin API Response data:", response.data);
          console.log(
            "[FeedbackList] Admin API Response data length:",
            response.data?.length
          );

          const data = response.data;
          setAllFeedback(data); // Admins can still filter by type on the frontend
          setDoctorFeedback(
            data.filter((item) => item.target_type === "DOCTOR")
          );
          setClinicFeedback(
            data.filter((item) => item.target_type === "SERVICE")
          );

          console.log("[FeedbackList] Admin - processed data:");
          console.log("  - All feedback count:", data.length);
          console.log(
            "  - Doctor feedback count:",
            data.filter((item) => item.target_type === "DOCTOR").length
          );
          console.log(
            "  - Clinic feedback count:",
            data.filter((item) => item.target_type === "SERVICE").length
          );
        } else {
          // Doctor gets ONLY their specific feedback from the correct endpoint
          if (!user?.id) {
            console.error("[FeedbackList] Doctor ID not found, user:", user);
            setError("Doctor ID not found");
            return;
          }

          const endpoint = `/feedback/doctor/${user.id}`;
          console.log(`[FeedbackList] Doctor branch - calling ${endpoint}`);

          const response = await api.get(endpoint);

          // DEBUG: Log the response
          console.log(
            "[FeedbackList] Doctor API Response status:",
            response.status
          );
          console.log(
            "[FeedbackList] Doctor API Response data:",
            response.data
          );
          console.log(
            "[FeedbackList] Doctor API Response data length:",
            response.data?.length
          );

          const data = response.data; // For doctors, all fetched feedback is "doctor feedback"
          setAllFeedback(data);
          setDoctorFeedback(data);
          // A doctor should not see any separate clinic feedback
          setClinicFeedback([]);

          console.log("[FeedbackList] Doctor - processed data:");
          console.log("  - All feedback count:", data.length);
          console.log("  - Doctor feedback count:", data.length);
          console.log("  - Clinic feedback count:", 0);
        }
      } catch (err: any) {
        console.error("!!! [FeedbackList] FAILED TO FETCH FEEDBACK !!!");
        console.error("Error object:", err);
        console.error("Error message:", err.message);
        console.error("Error response:", err.response);
        console.error("Error response data:", err.response?.data);
        console.error("Error response status:", err.response?.status);
        console.error("Error response statusText:", err.response?.statusText);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load feedback"
        );
      } finally {
        setLoading(false);
        console.log("=== FEEDBACKLIST DEBUG END ===");
      }
    };

    // Check if we should fetch
    console.log("[FeedbackList] useEffect dependency check:");
    console.log("  - user?.id:", user?.id);
    console.log("  - isAdmin:", isAdmin);
    console.log("  - Should fetch:", !!(user?.id || isAdmin));

    if (user?.id || isActuallyAdmin) {
      fetchFeedback();
    } else {
      console.warn("[FeedbackList] Not fetching - no user ID and not admin");
      setLoading(false);
    }
  }, [user?.id, isActuallyAdmin]);

  const feedbackStats = {
    total: allFeedback.length,
    withRating: allFeedback.filter((item) => item.rating_score !== null).length,
    averageRating:
      allFeedback.reduce((sum, item) => sum + (item.rating_score || 0), 0) /
      (allFeedback.filter((item) => item.rating_score !== null).length || 1),
    countByRating: {
      1: allFeedback.filter((item) => item.rating_score === 1).length,
      2: allFeedback.filter((item) => item.rating_score === 2).length,
      3: allFeedback.filter((item) => item.rating_score === 3).length,
      4: allFeedback.filter((item) => item.rating_score === 4).length,
      5: allFeedback.filter((item) => item.rating_score === 5).length,
    },
  };

  // DEBUG: Log stats whenever they change
  console.log("[FeedbackList] Current feedback stats:", feedbackStats);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return "No rating";

    const stars = [];
    for (let i = 0; i < rating; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  if (loading) {
    console.log("[FeedbackList] Rendering loading state");
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading feedback...</p>
      </div>
    );
  }

  console.log("[FeedbackList] Rendering main component");
  console.log("  - allFeedback length:", allFeedback.length);
  console.log("  - doctorFeedback length:", doctorFeedback.length);
  console.log("  - clinicFeedback length:", clinicFeedback.length);
  console.log("  - error:", error);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {isAdmin ? "All Patient Feedback" : "Patient Feedback"}
        </h1>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Feedback
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackStats.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {feedbackStats.withRating} ratings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              5-Star Ratings
            </CardTitle>
            <Star className="h-4 w-4 fill-current text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackStats.countByRating[5]}
            </div>
            <p className="text-xs text-muted-foreground">
              {feedbackStats.withRating > 0
                ? `${Math.round(
                    (feedbackStats.countByRating[5] /
                      feedbackStats.withRating) *
                      100
                  )}% of all ratings`
                : "No ratings yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allFeedback.filter((item) => item.comments?.trim()).length}
            </div>
            <p className="text-xs text-muted-foreground">
              With detailed comments
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Feedback</CardTitle>
          <CardDescription>
            Feedback received from your patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Feedback</TabsTrigger>
              <TabsTrigger value="doctor">Doctor Feedback</TabsTrigger>
              <TabsTrigger value="clinic">Clinic Feedback</TabsTrigger>
              <TabsTrigger value="withComments">With Comments</TabsTrigger>
              <TabsTrigger value="highRated">Highly Rated</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {renderFeedbackTable(allFeedback)}
            </TabsContent>

            <TabsContent value="doctor">
              {renderFeedbackTable(doctorFeedback)}
            </TabsContent>

            <TabsContent value="clinic">
              {renderFeedbackTable(clinicFeedback)}
            </TabsContent>

            <TabsContent value="withComments">
              {renderFeedbackTable(
                allFeedback.filter((item) => item.comments?.trim())
              )}
            </TabsContent>

            <TabsContent value="highRated">
              {renderFeedbackTable(
                allFeedback.filter((item) => (item.rating_score || 0) >= 4)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  function renderFeedbackTable(items: FeedbackItem[]) {
    console.log(
      "[FeedbackList] renderFeedbackTable called with items:",
      items.length
    );

    if (items.length === 0) {
      console.log("[FeedbackList] No items to render - showing empty state");
      return (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-semibold">No feedback found</h3>
          <p className="text-muted-foreground">
            There are no feedback items matching this criteria.
          </p>
        </div>
      );
    }

    console.log("[FeedbackList] Rendering table with", items.length, "items");

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead className="w-[200px]">Specific Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.feedback_id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {formatDate(item.submission_date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(item.submission_date)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {item.service ? (
                    <>
                      <span>{item.service.service_type}</span>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(item.service.start_time)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-medium">
                      General Clinic Feedback
                    </span>
                  )}
                  <Badge
                    variant={
                      item.target_type === FeedbackTargetType.DOCTOR
                        ? "default"
                        : "outline"
                    }
                    className="mt-1 w-fit"
                  >
                    {item.target_type === FeedbackTargetType.DOCTOR
                      ? "Doctor Specific"
                      : "Clinic General"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                {item.is_anonymous ? (
                  <Badge variant="secondary">Anonymous</Badge>
                ) : item.serviceParticipant ? (
                  <div className="flex flex-col">
                    <span>
                      {item.serviceParticipant.patient.user.first_name}{" "}
                      {item.serviceParticipant.patient.user.last_name}
                    </span>
                  </div>
                ) : (
                  <Badge variant="outline">Clinic Feedback</Badge>
                )}
              </TableCell>
              <TableCell>{renderStars(item.rating_score)}</TableCell>
              <TableCell className="max-w-md">
                {item.comments ? (
                  <div className="line-clamp-2">{item.comments}</div>
                ) : (
                  <span className="text-muted-foreground italic">
                    No comments
                  </span>
                )}
              </TableCell>
              <TableCell className="max-w-xs">
                {item.target_type === FeedbackTargetType.SERVICE ? (
                  <div className="flex flex-col gap-1">
                    {CLINIC_DISPLAY_ATTRIBUTES.filter(
                      (attr) => item[attr.field as keyof typeof item] === true
                    ).map((attr) => (
                      <div
                        key={attr.field}
                        className="flex items-center text-xs text-green-700"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {attr.label}
                      </div>
                    ))}
                    {CLINIC_DISPLAY_ATTRIBUTES.every(
                      (attr) => item[attr.field as keyof typeof item] !== true
                    ) && (
                      <span className="text-muted-foreground italic text-xs">
                        No specific attributes selected
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic text-xs">
                    N/A (Doctor Feedback)
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}
