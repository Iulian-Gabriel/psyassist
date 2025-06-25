import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
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
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- FIX: All types are now defined locally, no more @prisma/client import ---

interface UserData {
  first_name: string;
  last_name: string;
  email?: string;
}

interface DoctorWithUser {
  employee: {
    user: UserData;
  };
}

interface PatientWithUser {
  patient_id: number;
  user: UserData;
}

interface ServiceParticipantWithPatient {
  patient: PatientWithUser;
}

interface Service {
  service_id: number;
  service_type: string;
  start_time: string;
}

interface NoteWithRelations {
  note_id: number;
  content: string;
  created_at: string;
  patient: PatientWithUser;
  doctor: DoctorWithUser;
  service?: Service | null;
  serviceParticipant?: ServiceParticipantWithPatient | null;
}

interface ServiceWithParticipants extends Service {
  serviceParticipants: Array<{
    participant_id: number;
    patient_id: number;
    patient: PatientWithUser;
  }>;
}

// --- Component Definitions ---

const PatientSelector = ({
  patients,
  selectedPatient,
  onPatientSelected,
}: {
  patients: PatientWithUser[];
  selectedPatient: string;
  onPatientSelected: (patientId: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const filteredPatients = patients.filter((patient) => {
    const fullName =
      `${patient.user.first_name} ${patient.user.last_name}`.toLowerCase();
    const email = patient.user.email?.toLowerCase() || "";
    const search = inputValue.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const handleSelect = useCallback(
    (patientId: string) => {
      onPatientSelected(patientId);
      setOpen(false);
      setInputValue("");
    },
    [onPatientSelected]
  );

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
            if (!open) setOpen(true);
          }}
          onClick={() => setOpen(true)}
          className="w-full"
        />
        {selectedPatient && !inputValue && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
            {selectedPatientName}
          </div>
        )}
        {open && (
          <div className="absolute w-full z-50 bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
            {filteredPatients.length > 0 ? (
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
            ) : (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                No patients found
              </div>
            )}
          </div>
        )}
      </div>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
};

const AppointmentSelector = ({
  services,
  selectedService,
  onServiceSelected,
}: {
  services: ServiceWithParticipants[];
  selectedService: string;
  onServiceSelected: (serviceId: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (serviceId: string) => {
      onServiceSelected(serviceId);
      setOpen(false);
    },
    [onServiceSelected]
  );

  const selectedServiceObj = selectedService
    ? services.find((s) => s.service_id.toString() === selectedService)
    : null;

  const displayText = selectedServiceObj
    ? `${selectedServiceObj.service_type} - ${format(
        new Date(selectedServiceObj.start_time),
        "MMM d, yyyy h:mm a"
      )}`
    : "Search appointments...";

  return (
    <div className="grid gap-2">
      <Label htmlFor="appointment-search">Appointment (Optional)</Label>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full justify-start font-normal"
        >
          {displayText}
        </Button>
        {open && (
          <div className="absolute w-full z-50 bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
            <div
              className={`px-2 py-2 text-sm cursor-pointer hover:bg-accent ${
                selectedService === "" ? "bg-accent" : ""
              }`}
              onClick={() => handleSelect("")}
            >
              <div className="flex items-center justify-between">
                <span>No specific appointment (General Note)</span>
                {selectedService === "" && <Check className="h-4 w-4" />}
              </div>
            </div>
            {services.map((service) => (
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
                  <span>
                    {service.service_type} -{" "}
                    {format(new Date(service.start_time), "MMM d, yyyy h:mm a")}
                  </span>
                  {selectedService === service.service_id.toString() && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
};

export default function PatientNotes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<NoteWithRelations[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allServices, setAllServices] = useState<ServiceWithParticipants[]>([]);
  const [patients, setPatients] = useState<PatientWithUser[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [patientAppointments, setPatientAppointments] = useState<
    ServiceWithParticipants[]
  >([]);
  const [noteContent, setNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteWithRelations | null>(
    null
  );
  const [editContent, setEditContent] = useState("");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  // --- FIX: Wrapped fetchNotes in useCallback to satisfy exhaustive-deps ---
  const fetchNotes = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/notes/doctor/${user.id}`);
      setNotes(response.data);
    } catch (err) {
      console.error("Error fetching patient notes:", err);
      setError("Failed to load patient notes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // --- FIX: Added fetchNotes to dependency array ---
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async () => {
    try {
      setIsSubmitting(true);
      const [servicesResponse, patientsResponse] = await Promise.all([
        api.get("/notes/services"),
        api.get("/notes/patients"),
      ]);
      setAllServices(servicesResponse.data);
      setPatients(patientsResponse.data);
      setSelectedService("");
      setSelectedPatient("");
      setPatientAppointments([]);
      setNoteContent("");
      setIsDialogOpen(true);
    } catch (err) {
      console.error("Error preparing new note dialog:", err);
      setError("Failed to open new note dialog.");
    } finally {
      setIsSubmitting(false);
    }
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
      // Refetch notes after deleting
      await fetchNotes();
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
        return;
      }
      if (!noteContent.trim()) {
        setError("Please enter note content");
        return;
      }

      const payload = {
        patientId: selectedPatient,
        content: noteContent,
        ...(selectedService && { serviceId: selectedService }),
      };

      await api.post("/notes", payload);
      await fetchNotes(); // Refetch all notes to get the new one
      setIsDialogOpen(false);
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

      await api.put(`/notes/${editingNote.note_id}`, {
        content: editContent,
      });

      await fetchNotes(); // Refetch all notes to see the update
      setIsEditDialogOpen(false);
      setEditingNote(null);
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to update note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientSelectionChange = (patientId: string) => {
    setSelectedPatient(patientId);
    setSelectedService("");
    if (patientId) {
      const patientServices = allServices.filter((service) =>
        service.serviceParticipants.some(
          (p) => p.patient_id.toString() === patientId
        )
      );
      setPatientAppointments(patientServices);
    } else {
      setPatientAppointments([]);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const patientName = `${note.patient.user.first_name} ${note.patient.user.last_name}`;
    const doctorName = `${note.doctor.employee.user.first_name} ${note.doctor.employee.user.last_name}`;
    const serviceType = note.service?.service_type || "";
    const noteContent = note.content;

    const searchString =
      `${patientName} ${doctorName} ${serviceType} ${noteContent}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patient Notes</h1>
        <Button onClick={handleAddNote} disabled={isSubmitting}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Note
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Notes</CardTitle>
          <CardDescription>
            Search by content, patient, or service type
          </CardDescription>
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
            Notes from patient consultations and general records
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
                  <TableHead>Service / Note Type</TableHead>
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
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        {note.patient.user.first_name}{" "}
                        {note.patient.user.last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {note.service ? (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {note.service.service_type}
                        </div>
                      ) : (
                        <Badge variant="secondary">General Note</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {note.service ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(note.service.start_time), "h:mm a")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
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
                          variant="destructive"
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add New Patient Note</DialogTitle>
            <DialogDescription>Create a note for a patient.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <PatientSelector
              patients={patients}
              selectedPatient={selectedPatient}
              onPatientSelected={handlePatientSelectionChange}
            />
            {selectedPatient && (
              <AppointmentSelector
                services={patientAppointments}
                selectedService={selectedService}
                onServiceSelected={setSelectedService}
              />
            )}
            <div className="grid gap-2">
              <Label htmlFor="content">Note Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your notes..."
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <div className="mt-1 font-medium">
                    {format(new Date(editingNote.created_at), "MMM d, yyyy")}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <div className="mt-1 font-medium">
                    {editingNote.patient.user.first_name}{" "}
                    {editingNote.patient.user.last_name}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Appointment</Label>
                <div className="mt-1 font-medium">
                  {editingNote.service
                    ? `${editingNote.service.service_type} - ${format(
                        new Date(editingNote.service.start_time),
                        "h:mm a"
                      )}`
                    : "General Note"}
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
            </div>
          )}
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
