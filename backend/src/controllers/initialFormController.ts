import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

// Get initial assessment form structure
export const getInitialAssessmentForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const formStructure = {
      title: "Initial Psychological Assessment",
      description: "Questionnaire for evaluating anxiety states and symptoms",
      sections: [
        {
          id: "section_1",
          title: "I. Anxious Experiences",
          description:
            "The subject/patient manifests the following states and experiences as stated in the psychoclinical interview:",
          questions: [
            {
              id: "q1_1",
              text: "Restlessness, nervousness, worry, fear, unmotivated by life circumstances.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q1_2",
              text: "Sudden, unexpected states of panic, behavioral agitation (agitates without reason, can't find their place).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q1_3",
              text: "Fear triggered by the impression that something bad will happen, a misfortune; that they or someone close is in danger.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q1_4",
              text: "State of tension, strain; as if having a 'bundle of nerves'.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q1_5",
              text: "Impression of ego change; that they are no longer themselves, state of 'spiritual emptiness', of 'inner void' – depersonalization.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q1_6",
              text: "Feeling of estrangement from the external world, that they are 'lost in space' (derealization).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q1_7",
              text: "Impression of detachment from one's own body – 'my own body is foreign to me'. Alteration of bodily feelings (desomatization).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
          ],
        },
        {
          id: "section_2",
          title: "II. Anxious Thoughts",
          description:
            "The subject/patient experiences the following anxious thoughts and ideas:",
          questions: [
            {
              id: "q2_1",
              text: "Concentration difficulties; 'losing the thread', 'doesn't know what they read', loses rhythm in activity.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q2_2",
              text: "Rapid succession of thoughts, accelerated pace of ideation (the pace is tiring for the subject, causes difficulties in mental activity).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q2_3",
              text: "Suspicions, assumptions, unfounded fears determined by: facts, words from others with distorted meaning; situations they've been through, everyday but with exaggerated significance given by the patient.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q2_4",
              text: "Thought that they are at the limit, that they might lose control, that they might do something thoughtless.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q2_5",
              text: "Fear of having a nervous breakdown, of becoming seriously mentally ill (of 'losing their mind').",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q2_6",
              text: "Fear of fainting or losing consciousness (psychological tension so strong it could generate fainting).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q2_7",
              text: "Fear of a serious physical illness (possibly incurable), of heart attacks, of death.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q2_8",
              text: "Worry, concerns related to behaving inappropriately in situations (making a fool of themselves, not coping, not meeting expectations).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q2_9",
              text: "Fear of loneliness or of not being alone, of being abandoned by those around them.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q2_10",
              text: "Fear of criticism, reproach, disapproval, related to what they will say or do (verbal behavior and manifestations in activity).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q2_11",
              text: "Fear that something terrible, horrible will happen (something vague, undefined).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
          ],
        },
        {
          id: "section_3",
          title: "III. Psychosomatic Symptoms",
          description:
            "The subject/patient experiences the following physical symptoms:",
          questions: [
            {
              id: "q3_1",
              text: "Rapid, accelerated, strong heartbeats (palpitations).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_2",
              text: "Pain, pressure in the chest area.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_3",
              text: "Tingling or numbness in the extremities (fingers, hands and feet).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_4",
              text: "Tension, restlessness or discomfort in the stomach area (epigastrium).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_5",
              text: "Various digestive disorders.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_6",
              text: "Insomnia states.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_7",
              text: "Tension, muscle tension (global or localized).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_8",
              text: "Chills, tremor, as in the sensation of cold.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_9",
              text: "Unsteadiness in walking, sensation of lack of energy in legs (like rubber).",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_10",
              text: "Sensations of heat, sweating, independent of outside temperature.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_11",
              text: "Sensations of dizziness, confusion and uncertainty.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_12",
              text: "Sensations of suffocation, asphyxia, breathing difficulties (impression of 'lack of air').",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_13",
              text: "Headaches, back pain, neck pain.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_14",
              text: "Sensation of 'lump in throat', difficulty swallowing.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_15",
              text: "Sudden short-circuit sensations, alternation of hot/cold sensations like 'ice'.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
            {
              id: "q3_16",
              text: "Sensations of fatigue, lack of energy (without vigor, without power) or tendency to tire easily.",
              type: "radio",
              required: true,
              options: [
                { value: "0", label: "Never" },
                { value: "1", label: "Sometimes" },
                { value: "2", label: "Often" },
                { value: "3", label: "Very often" },
              ],
            },
          ],
        },
      ],
    };

    res.json(formStructure);
  } catch (error) {
    console.error("Error getting initial assessment form:", error);
    res.status(500).json({ message: "Failed to get form structure" });
  }
};

// Submit initial assessment form
export const submitInitialAssessment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Find patient record
    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient profile not found" });
      return;
    }

    const { responses } = req.body;

    // Calculate scores for each section
    const calculateSectionScore = (
      sectionQuestions: string[],
      responses: any
    ) => {
      return sectionQuestions.reduce((total, questionId) => {
        const value = parseInt(responses[questionId]) || 0;
        return total + value;
      }, 0);
    };

    const section1Questions = [
      "q1_1",
      "q1_2",
      "q1_3",
      "q1_4",
      "q1_5",
      "q1_6",
      "q1_7",
    ];
    const section2Questions = [
      "q2_1",
      "q2_2",
      "q2_3",
      "q2_4",
      "q2_5",
      "q2_6",
      "q2_7",
      "q2_8",
      "q2_9",
      "q2_10",
      "q2_11",
    ];
    const section3Questions = [
      "q3_1",
      "q3_2",
      "q3_3",
      "q3_4",
      "q3_5",
      "q3_6",
      "q3_7",
      "q3_8",
      "q3_9",
      "q3_10",
      "q3_11",
      "q3_12",
      "q3_13",
      "q3_14",
      "q3_15",
      "q3_16",
    ];

    const scores = {
      anxious_experiences: calculateSectionScore(section1Questions, responses),
      anxious_thoughts: calculateSectionScore(section2Questions, responses),
      psychosomatic_symptoms: calculateSectionScore(
        section3Questions,
        responses
      ),
    };

    const totalScore =
      scores.anxious_experiences +
      scores.anxious_thoughts +
      scores.psychosomatic_symptoms;

    // Store form data
    const formData = {
      responses,
      scores,
      totalScore,
      submittedAt: new Date().toISOString(),
      formType: "initial_assessment",
    };

    // Check if patient already has a submission
    const existingSubmission = await prisma.patientForm.findFirst({
      where: {
        patient_id: patient.patient_id,
        form_data: {
          path: ["formType"],
          equals: "initial_assessment",
        },
      },
    });

    let patientForm;
    if (existingSubmission) {
      // Update existing submission
      patientForm = await prisma.patientForm.update({
        where: { form_id: existingSubmission.form_id },
        data: {
          form_data: formData,
          submission_date: new Date(),
          status: "Completed",
        },
      });
    } else {
      // Create new submission
      patientForm = await prisma.patientForm.create({
        data: {
          patient_id: patient.patient_id,
          form_data: formData,
          status: "Completed",
        },
      });
    }

    res.status(201).json({
      message: "Initial assessment submitted successfully",
      form_id: patientForm.form_id,
      scores,
      totalScore,
    });
  } catch (error) {
    console.error("Error submitting initial assessment:", error);
    res.status(500).json({ message: "Failed to submit assessment" });
  }
};

// Get patient's initial assessment results
export const getPatientInitialAssessment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Find patient record
    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient profile not found" });
      return;
    }

    // Find patient's initial assessment
    const patientForm = await prisma.patientForm.findFirst({
      where: {
        patient_id: patient.patient_id,
        form_data: {
          path: ["formType"],
          equals: "initial_assessment",
        },
      },
      orderBy: {
        submission_date: "desc",
      },
    });

    if (!patientForm) {
      res.status(404).json({ message: "No initial assessment found" });
      return;
    }

    res.json({
      form_id: patientForm.form_id,
      submission_date: patientForm.submission_date,
      status: patientForm.status,
      data: patientForm.form_data,
    });
  } catch (error) {
    console.error("Error fetching initial assessment:", error);
    res.status(500).json({ message: "Failed to fetch assessment results" });
  }
};

// Check if patient has completed initial assessment
export const checkInitialAssessmentStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Find patient record
    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient profile not found" });
      return;
    }

    // Check if patient has completed initial assessment
    const existingSubmission = await prisma.patientForm.findFirst({
      where: {
        patient_id: patient.patient_id,
        form_data: {
          path: ["formType"],
          equals: "initial_assessment",
        },
      },
    });

    res.json({
      hasCompleted: !!existingSubmission,
      lastSubmissionDate: existingSubmission?.submission_date || null,
    });
  } catch (error) {
    console.error("Error checking initial assessment status:", error);
    res.status(500).json({ message: "Failed to check assessment status" });
  }
};
