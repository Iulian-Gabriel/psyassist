import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { ArrowLeft, CheckCircle, Calendar, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface AssessmentResults {
  form_id: number;
  submission_date: string;
  status: string;
  data: {
    responses: Record<string, string>;
    scores: {
      anxious_experiences: number;
      anxious_thoughts: number;
      psychosomatic_symptoms: number;
    };
    totalScore: number;
    submittedAt: string;
    formType: string;
  };
}

export default function InitialAssessmentResults() {
  const location = useLocation();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const successMessage = location.state?.message;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await api.get("/initial-form/results");
        setResults(response.data);
      } catch (err: any) {
        console.error("Error fetching assessment results:", err);
        if (err.response?.status === 404) {
          setError("You haven't completed the initial assessment yet.");
        } else {
          setError("Error loading assessment results.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const getScoreInterpretation = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage < 25)
      return { level: "Low", color: "bg-green-100 text-green-800" };
    if (percentage < 50)
      return { level: "Moderate", color: "bg-yellow-100 text-yellow-800" };
    if (percentage < 75)
      return { level: "High", color: "bg-orange-100 text-orange-800" };
    return { level: "Very High", color: "bg-red-100 text-red-800" };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <ApiErrorDisplay error={error} />
        <div className="mt-4 space-x-4">
          <Link to="/patient/initial-form">
            <Button>Complete Assessment</Button>
          </Link>
          <Link to="/patient">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container mx-auto p-4">
        <p>No results found.</p>
      </div>
    );
  }

  const { scores, totalScore } = results.data;
  const maxTotalScore = 7 * 3 + 11 * 3 + 16 * 3; // max scores for each section

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Link to="/patient">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Initial Assessment Results</h1>
      </div>

      {successMessage && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Date
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(results.submission_date), "MMMM d, yyyy")}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(results.submission_date), "HH:mm")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalScore} / {maxTotalScore}
            </div>
            <div className="mt-2">
              <Badge
                className={
                  getScoreInterpretation(totalScore, maxTotalScore).color
                }
              >
                {getScoreInterpretation(totalScore, maxTotalScore).level}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anxious Experiences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {scores.anxious_experiences} / 21
            </div>
            <Badge
              className={
                getScoreInterpretation(scores.anxious_experiences, 21).color
              }
            >
              {getScoreInterpretation(scores.anxious_experiences, 21).level}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Evaluates general anxious states and experiences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anxious Thoughts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {scores.anxious_thoughts} / 33
            </div>
            <Badge
              className={
                getScoreInterpretation(scores.anxious_thoughts, 33).color
              }
            >
              {getScoreInterpretation(scores.anxious_thoughts, 33).level}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Measures anxious thoughts and concerns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Psychosomatic Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {scores.psychosomatic_symptoms} / 48
            </div>
            <Badge
              className={
                getScoreInterpretation(scores.psychosomatic_symptoms, 48).color
              }
            >
              {getScoreInterpretation(scores.psychosomatic_symptoms, 48).level}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Evaluates physical manifestations of anxiety
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Results Interpretation</CardTitle>
          <CardDescription>
            These results provide insight into your current level of anxiety
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">What these scores mean:</h4>
            <ul className="space-y-2 text-sm">
              <li>
                • <strong>Low (0-25%):</strong> Minimal level of anxiety
                symptoms
              </li>
              <li>
                • <strong>Moderate (25-50%):</strong> Moderate level of anxiety,
                may need attention
              </li>
              <li>
                • <strong>High (50-75%):</strong> High level of anxiety,
                professional support recommended
              </li>
              <li>
                • <strong>Very High (75-100%):</strong> Very high level,
                specialized intervention needed
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Important note:</strong> These results represent a
              preliminary assessment and do not constitute a medical diagnosis.
              For a complete evaluation and personalized recommendations, please
              discuss with your psychologist.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Link to="/patient/initial-form">
          <Button variant="outline">Retake Assessment</Button>
        </Link>
      </div>
    </div>
  );
}
