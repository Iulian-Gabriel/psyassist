import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Notes, Service, Patient, ServiceParticipant } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import {
  PlusCircle,
  FileText,
  Edit,
  Trash2,
  Search,
  CalendarIcon,
  UserIcon,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CheckIcon, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Define types with relations (extending Prisma types)
interface NoteWithRelations extends Notes {
  service: ServiceWithDoctor;
  serviceParticipant?: ServiceParticipantWithPatient;
}

interface ServiceWithDoctor extends Service {
  doctor: {
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

interface ServiceParticipantWithPatient extends ServiceParticipant {
  patient: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

interface ServiceWithRelations extends Service {
  doctor: {
    doctor_id: number;
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
  serviceParticipants: Array<{
    participant_id: number;
    patient_id: number;
    patient: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  }>;
}

interface PatientWithUser extends Patient {
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Create a patient selection component to isolate the logic
const PatientSelector = ({
  patients,
  selectedPatient,
  onPatientSelected,
}: {
  patients: PatientWithUser[];
  selectedPatient: string;
  onPatientSelected: (patientId: string) => void;
}) => {
  const [open, setOpen] = useState(false); // Don't open initially
  const [inputValue, setInputValue] = useState("");

  // Filter patients based on search input
  const filteredPatients = patients.filter((patient) => {
    const fullName =
      `${patient.user.first_name} ${patient.user.last_name}`.toLowerCase();
    const email = patient.user.email.toLowerCase();
    const search = inputValue.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Function to handle selection
  const handleSelect = useCallback(
    (patientId: string) => {
      onPatientSelected(patientId);
      setOpen(false);
      setInputValue(""); // Clear input value after selection
    },
    [onPatientSelected]
  );

  // Get the selected patient's name if available
  const selectedPatientObj = selectedPatient
    ? patients.find((p) => p.patient_id.toString() === selectedPatient)
    : null;

  const selectedPatientName = selectedPatientObj
    ? `${selectedPatientObj.user.first_name} ${selectedPatientObj.user.last_name}`
    : "";

  return (
    <div className="grid gap-2">
      <Label htmlFor="patient-search">Patient (Required)</Label>
      <div className="relative">
        <Input
          id="patient-search"
          placeholder={selectedPatient ? "" : "Search for a patient..."}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            // Open dropdown when user starts typing
            if (!open) {
              setOpen(true);
            }
          }}
          onClick={() => setOpen(true)}
          className="w-full"
        />

        {/* Show selected patient name when input is empty and patient is selected */}
        {selectedPatient && inputValue === "" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
            {selectedPatientName}
          </div>
        )}

        {open && (
          <div className="absolute w-full z-50 bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
            {filteredPatients.length === 0 ? (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                No patients found
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.patient_id}
                  className={`px-2 py-2 text-sm cursor-pointer hover:bg-accent ${
                    selectedPatient === patient.patient_id.toString()
                      ? "bg-accent"
                      : ""
                  }`}
                  onClick={() => handleSelect(patient.patient_id.toString())}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {patient.user.first_name} {patient.user.last_name}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({patient.user.email})
                      </span>
                    </div>
                    {selectedPatient === patient.patient_id.toString() && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
};

// Cleaner version of the AppointmentSelector component

const AppointmentSelector = ({
  services,
  selectedService,
  onServiceSelected,
}: {
  services: ServiceWithRelations[];
  selectedService: string;
  onServiceSelected: (serviceId: string) => void;
}) => {
  const [open, setOpen] = useState(false); // Don't open initially
  const [inputValue, setInputValue] = useState("");

  // Filter services based on search input
  const filteredServices = services.filter((service) => {
    const serviceType = service.service_type.toLowerCase();
    const dateTime = format(
      new Date(service.start_time),
      "MMM d, yyyy h:mm a"
    ).toLowerCase();
    const search = inputValue.toLowerCase();
    return serviceType.includes(search) || dateTime.includes(search);
  });

  // Function to handle selection
  const handleSelect = useCallback(
    (serviceId: string) => {
      onServiceSelected(serviceId);
      setOpen(false);
      setInputValue(""); // Clear input value after selection
    },
    [onServiceSelected]
  );

  // Get selected service details
  const selectedServiceObj = selectedService
    ? services.find((s) => s.service_id.toString() === selectedService)
    : null;

  // Get display text
  const displayText = selectedServiceObj
    ? `${selectedServiceObj.service_type} - ${format(
        new Date(selectedServiceObj.start_time),
        "MMM d, yyyy h:mm a"
      )}`
    : "";

  return (
    <div className="grid gap-2">
      <Label htmlFor="appointment-search">Appointment (Optional)</Label>
      <div className="relative">
        <Input
          id="appointment-search"
          placeholder={selectedService ? "" : "Search appointments..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setOpen(true)}
          className="w-full"
        />

        {/* Show selected appointment when input is empty */}
        {inputValue === "" && (
          <div
            className="absolute inset-0 left-3 flex items-center cursor-pointer"
            onClick={() => {
              // Focus the input, which will open the dropdown
              document.getElementById("appointment-search")?.focus();
            }}
          >
            <span className="text-sm">{displayText}</span>
          </div>
        )}

        {open && (
          <div className="absolute w-full z-50 bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
            <div
              className={`px-2 py-2 text-sm cursor-pointer hover:bg-accent ${
                selectedService === "" ? "bg-accent" : ""
              }`}
              onClick={() => handleSelect("")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">No specific appointment</span>
                </div>
                {selectedService === "" && <Check className="h-4 w-4" />}
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                No appointments found
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.service_id}
                  className={`px-2 py-2 text-sm cursor-pointer hover:bg-accent ${
                    selectedService === service.service_id.toString()
                      ? "bg-accent"
                      : ""
                  }`}
                  onClick={() => handleSelect(service.service_id.toString())}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {service.service_type}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {format(
                          new Date(service.start_time),
                          "MMM d, yyyy h:mm a"
                        )}
                      </span>
                    </div>
                    {selectedService === service.service_id.toString() && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
};

export default function PatientNotes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<NoteWithRelations[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // New note dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allServices, setAllServices] = useState<ServiceWithRelations[]>([]);
  const [patients, setPatients] = useState<PatientWithUser[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [patientAppointments, setPatientAppointments] = useState<
    ServiceWithRelations[]
  >([]);
  const [noteContent, setNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit note dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteWithRelations | null>(
    null
  );
  const [editContent, setEditContent] = useState("");

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);

        // For now, we'll just fetch all notes since we don't have role-based access yet
        const response = await api.get("/notes/doctor/1"); // Using a placeholder doctor ID for now

        setNotes(response.data);
      } catch (err) {
        console.error("Error fetching patient notes:", err);
        setError("Failed to load patient notes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get("/notes/services");
      setAllServices(response.data);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to load services. Please try again.");
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get("/notes/patients");
      setPatients(response.data);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to load patients. Please try again.");
    }
  };

  const handleAddNote = () => {
    fetchServices();
    fetchPatients();
    setSelectedService("");
    setSelectedPatient("");
    setPatientAppointments([]);
    setNoteContent("");
    setIsDialogOpen(true);
  };

  const handleEditNote = (note: NoteWithRelations) => {
    setEditingNote(note);
    setEditContent(note.content);
    setIsEditDialogOpen(true);
  };

  const handleDeletePrompt = (noteId: number) => {
    setDeletingNoteId(noteId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteNote = async () => {
    if (!deletingNoteId) return;

    try {
      setIsSubmitting(true);
      await api.delete(`/notes/${deletingNoteId}`);

      // Remove the deleted note from the state
      setNotes(notes.filter((note) => note.note_id !== deletingNoteId));

      setIsDeleteDialogOpen(false);
      setDeletingNoteId(null);
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!selectedPatient) {
        setError("Please select a patient");
        setIsSubmitting(false);
        return;
      }

      if (!noteContent.trim()) {
        setError("Please enter note content");
        setIsSubmitting(false);
        return;
      }

      // Create payload based on whether an appointment is selected
      const payload = {
        patientId: selectedPatient,
        content: noteContent,
        // Only include serviceId if one is selected
        ...(selectedService && { serviceId: selectedService }),
      };

      const response = await api.post("/notes", payload);

      // Add the new note to the state
      setNotes([response.data, ...notes]);

      setIsDialogOpen(false);
      setNoteContent("");
      setSelectedService("");
      setSelectedPatient("");
    } catch (err) {
      console.error("Error creating note:", err);
      setError("Failed to create note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    try {
      setIsSubmitting(true);

      if (!editContent.trim()) {
        setError("Please enter note content");
        return;
      }

      const response = await api.put(`/notes/${editingNote.note_id}`, {
        content: editContent,
      });

      // Update the note in the state
      setNotes(
        notes.map((note) =>
          note.note_id === editingNote.note_id ? response.data : note
        )
      );

      setIsEditDialogOpen(false);
      setEditingNote(null);
      setEditContent("");
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to update note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patientId = e.target.value;
    setSelectedPatient(patientId);
    setSelectedService(""); // Reset service selection when patient changes

    if (patientId) {
      // Filter services for this patient
      const patientServices = allServices.filter((service) =>
        service.serviceParticipants.some(
          (participant) => participant.patient_id.toString() === patientId
        )
      );
      setPatientAppointments(patientServices);
    } else {
      setPatientAppointments([]);
    }
  };

  // Filter notes based on search term
  const filteredNotes = notes.filter((note) => {
    const patientName =
      note.serviceParticipant?.patient.user.first_name +
        " " +
        note.serviceParticipant?.patient.user.last_name || "";
    const doctorName =
      note.service.doctor.employee.user.first_name +
      " " +
      note.service.doctor.employee.user.last_name;
    const serviceType = note.service.service_type;
    const noteContent = note.content;

    const searchString =
      `${patientName} ${doctorName} ${serviceType} ${noteContent}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patient Notes</h1>
        <Button onClick={handleAddNote}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Note
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Search Notes</CardTitle>
              <CardDescription>
                Search for patient notes by content, patient name, or service
                type
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Patient Notes</CardTitle>
          <CardDescription>
            Notes from patient consultations and appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <p>Loading notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center p-6">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No notes found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleAddNote}
              >
                Create your first note
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Appointment Time</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.map((note) => (
                  <TableRow key={note.note_id}>
                    <TableCell>
                      {format(new Date(note.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {note.serviceParticipant ? (
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          {note.serviceParticipant.patient.user.first_name}{" "}
                          {note.serviceParticipant.patient.user.last_name}
                        </div>
                      ) : (
                        <Badge variant="outline">No Patient</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {note.service.service_type}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(note.service.start_time), "h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate">{note.content}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePrompt(note.note_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add New Patient Note</DialogTitle>
            <DialogDescription>
              Create a note for a patient with optional appointment selection
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Patient selection with custom component */}
            <PatientSelector
              patients={patients}
              selectedPatient={selectedPatient}
              onPatientSelected={(patientId) => {
                setSelectedPatient(patientId);
                // Create a synthetic event to pass to handlePatientChange
                const event = {
                  target: { value: patientId },
                } as React.ChangeEvent<HTMLSelectElement>;
                handlePatientChange(event);
              }}
            />

            {/* Appointment selection with custom component */}
            {selectedPatient &&
              (patientAppointments.length > 0 ? (
                <AppointmentSelector
                  services={patientAppointments}
                  selectedService={selectedService}
                  onServiceSelected={(serviceId) => {
                    setSelectedService(serviceId);
                  }}
                />
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="service">Appointment (Optional)</Label>
                  <div className="p-2 border border-input rounded-md bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      This patient has no appointments on record. You can still
                      create a general note.
                    </p>
                  </div>
                </div>
              ))}

            <div className="grid gap-2">
              <Label htmlFor="content">Note Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your notes about the patient here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNote}
              disabled={isSubmitting || !selectedPatient || !noteContent.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update the content of your note
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editingNote && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <div className="mt-1">
                      {format(new Date(editingNote.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Appointment</Label>
                    <div className="mt-1">
                      {editingNote.service.service_type} -{" "}
                      {format(
                        new Date(editingNote.service.start_time),
                        "h:mm a"
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <div className="mt-1">
                    {editingNote.serviceParticipant
                      ? `${editingNote.serviceParticipant.patient.user.first_name} ${editingNote.serviceParticipant.patient.user.last_name}`
                      : "No patient selected"}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-content">Note Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateNote}
              disabled={isSubmitting || !editContent.trim()}
            >
              {isSubmitting ? "Updating..." : "Update Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteNote}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
