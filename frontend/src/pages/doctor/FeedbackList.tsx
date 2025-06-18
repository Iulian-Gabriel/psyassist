import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

// UI Components
import { Button } from "../../components/ui/button";
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
  Clock,
  MessagesSquare,
} from "lucide-react";

interface FeedbackItem {
  feedback_id: number;
  service_id: number;
  participant_id: number;
  rating_score: number | null;
  comments: string | null;
  submission_date: string;
  is_anonymous: boolean;
  service: {
    service_type: string;
    start_time: string;
    end_time: string;
  };
  serviceParticipant: {
    patient: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

export default function FeedbackList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [doctorFeedback, setDoctorFeedback] = useState<FeedbackItem[]>([]);
  const [clinicFeedback, setClinicFeedback] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user?.id) {
          setError("User ID not found");
          return;
        }

        // Use the new endpoint that provides categorized feedback
        const response = await api.get(`/feedback/doctor/${user.id}/all`);

        // The response now includes categorized feedback
        setFeedback(response.data.all); // All feedback
        setDoctorFeedback(response.data.doctorSpecific); // Doctor-specific feedback
        setClinicFeedback(response.data.clinicFeedback); // Clinic feedback
      } catch (err: any) {
        console.error("Failed to fetch feedback:", err);
        setError(err.message || "Failed to load feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [user?.id]);

  // Group feedback by rating for statistics
  const feedbackStats = {
    total: feedback.length,
    withRating: feedback.filter((item) => item.rating_score !== null).length,
    averageRating:
      feedback.reduce((sum, item) => sum + (item.rating_score || 0), 0) /
      (feedback.filter((item) => item.rating_score !== null).length || 1),
    countByRating: {
      1: feedback.filter((item) => item.rating_score === 1).length,
      2: feedback.filter((item) => item.rating_score === 2).length,
      3: feedback.filter((item) => item.rating_score === 3).length,
      4: feedback.filter((item) => item.rating_score === 4).length,
      5: feedback.filter((item) => item.rating_score === 5).length,
    },
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render stars for rating
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
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patient Feedback</h1>
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
              {feedback.filter((item) => item.comments?.trim()).length}
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
              {renderFeedbackTable(feedback)}
            </TabsContent>

            <TabsContent value="doctor">
              {renderFeedbackTable(doctorFeedback)}
            </TabsContent>

            <TabsContent value="clinic">
              {renderFeedbackTable(clinicFeedback)}
            </TabsContent>

            <TabsContent value="withComments">
              {renderFeedbackTable(
                feedback.filter((item) => item.comments?.trim())
              )}
            </TabsContent>

            <TabsContent value="highRated">
              {renderFeedbackTable(
                feedback.filter((item) => (item.rating_score || 0) >= 4)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  function renderFeedbackTable(items: FeedbackItem[]) {
    if (items.length === 0) {
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

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Service Type</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Comments</TableHead>
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
                  <span>{item.service.service_type}</span>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(item.service.start_time)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {item.is_anonymous ? (
                  <Badge variant="secondary">Anonymous</Badge>
                ) : (
                  <div className="flex flex-col">
                    <span>
                      {item.serviceParticipant.patient.user.first_name}{" "}
                      {item.serviceParticipant.patient.user.last_name}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>{renderStars(item.rating_score)}</TableCell>
              <TableCell className="max-w-md">
                {item.comments ? (
                  <div className="line-clamp-2">{item.comments}</div>
                ) : (
                  <span className="text-muted-foreground italic">
                    No comments provided
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
