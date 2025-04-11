import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  useDisclosure,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import imageCompression from "browser-image-compression";
import { useUser } from "@clerk/nextjs";

interface School {
  _id: string;
  name: string;
  slug: string;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  location: string;
  createdAt: number;
}

export default function SchoolList() {
  const { user } = useUser();
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onOpenChange: onAddOpenChange,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const [selectedSchool, setSelectedSchool] = React.useState<School | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);

  const addSchool = useMutation(api.schools.add);
  const updateSchool = useMutation(api.schools.update);
  const deleteSchool = useMutation(api.schools.remove);
  const notify = useMutation(api.notifications.add);
  const schools = useQuery(api.schools.getAll) as School[] | undefined;

  const [selectedLogo, setSelectedLogo] = React.useState<string | null>(null);
  const [selectedBanner, setSelectedBanner] = React.useState<string | null>(
    null
  );

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.8, // Compress to under 0.8 MiB to ensure it's below 1 MiB
          maxWidthOrHeight: 1024, // Resize to a maximum dimension of 1024px
          useWebWorker: true,
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Image compression failed:", error);
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);

      const schoolData = {
        name: data.name as string,
        slug: data.slug as string,
        logoUrl: selectedLogo || "/images/placeholder.webp",
        bannerUrl: selectedBanner || "/images/placeholder.webp",
        description: data.description as string || "",
        location: data.location as string || "",
        createdAt: Date.now(),
      };

      await addSchool(schoolData);
      if (user) {
        await notify({
          userId: user.id as Id<"users">,
          message: "School added successfully!",
          type: "success",
        });
      }
      setSelectedLogo(null);
      setSelectedBanner(null);
      onAddOpenChange(); // Close the modal
    } catch (err) {
      setError("Failed to add school. Please try again.");
      if (user) {
        await notify({
          userId: user.id as Id<"users">,
          message: "Failed to add school. Please try again.",
          type: "error",
        });
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);

      if (selectedSchool) {
        const schoolData = {
          schoolId: selectedSchool._id as Id<"schools">,
          name: data.name as string,
          slug: data.slug as string,
          logoUrl: selectedLogo || selectedSchool.logoUrl,
          bannerUrl: selectedBanner || selectedSchool.bannerUrl,
          description: data.description as string || undefined,
          location: data.location as string || undefined,
        };

        await updateSchool(schoolData);
        if (user) {
          await notify({
            userId: user.id as Id<"users">,
            message: "School updated successfully!",
            type: "success",
          });
        }
        setSelectedLogo(null);
        setSelectedBanner(null);
        onEditOpenChange(); // Close the modal
      }
    } catch (err) {
      setError("Failed to update school. Please try again.");
      if (user) {
        await notify({
          userId: user.id as Id<"users">,
          message: "Failed to update school. Please try again.",
          type: "error",
        });
      }
    }
  };

  const handleDelete = async () => {
    setError(null);

    try {
      if (selectedSchool) {
        await deleteSchool({ schoolId: selectedSchool._id as Id<"schools"> });
        onDeleteOpenChange(); // Close the modal after successful deletion
      }
    } catch (err) {
      setError("Failed to delete school. Please try again.");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Schools</h1>
        <Button color="primary" onPress={onAddOpen}>
          Add School
        </Button>
      </div>

      {error && (
        <div className="text-danger mb-4 p-2 rounded bg-danger-50">{error}</div>
      )}

      <Table
        aria-label="Schools list"
        classNames={{
          wrapper: "shadow-none",
        }}
      >
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>SLUG</TableColumn>
          <TableColumn>LOCATION</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No schools available">
          <>
            {schools?.map((school) => (
              <TableRow key={school._id}>
                <TableCell>{school.name}</TableCell>
                <TableCell>{school.slug}</TableCell>
                <TableCell>{school.location}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onPress={() => {
                      setSelectedSchool(school);
                      onEditOpen();
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    onPress={() => {
                      setSelectedSchool(school);
                      onDeleteOpen();
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </>
        </TableBody>
      </Table>

      {/* Add School Modal */}
      <Modal isOpen={isAddOpen} onOpenChange={onAddOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Add New School
              </ModalHeader>
              <ModalBody>
                <Form
                  className="flex flex-col gap-4"
                  onSubmit={handleAddSubmit}
                >
                  <Input
                    isRequired
                    label="Name"
                    name="name"
                    placeholder="Enter school name"
                    variant="bordered"
                  />
                  <Input
                    isRequired
                    label="Slug"
                    name="slug"
                    placeholder="Enter school slug"
                    variant="bordered"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Logo
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(e, setSelectedLogo)}
                      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    {selectedLogo && (
                      <img
                        src={selectedLogo}
                        alt="Logo Preview"
                        className="mt-2 h-24 w-24 object-cover rounded-md"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Banner
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(e, setSelectedBanner)}
                      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    {selectedBanner && (
                      <img
                        src={selectedBanner}
                        alt="Banner Preview"
                        className="mt-2 h-24 w-full object-cover rounded-md"
                      />
                    )}
                  </div>
                  <Input
                    isRequired
                    label="Description"
                    name="description"
                    placeholder="Enter school description"
                    variant="bordered"
                  />
                  <Input
                    isRequired
                    label="Location"
                    name="location"
                    placeholder="Enter school location"
                    variant="bordered"
                  />
                  <div className="flex justify-end gap-2">
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancel
                    </Button>
                    <Button color="primary" type="submit">
                      Add School
                    </Button>
                  </div>
                </Form>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit School Modal */}
      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Edit School
              </ModalHeader>
              <ModalBody>
                <Form
                  className="flex flex-col gap-4"
                  onSubmit={handleEditSubmit}
                >
                  <Input
                    isRequired
                    label="Name"
                    name="name"
                    defaultValue={selectedSchool?.name}
                    placeholder="Enter school name"
                    variant="bordered"
                  />
                  <Input
                    isRequired
                    label="Slug"
                    name="slug"
                    defaultValue={selectedSchool?.slug}
                    placeholder="Enter school slug"
                    variant="bordered"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Logo
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(e, setSelectedLogo)}
                      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    {selectedLogo ? (
                      <img
                        src={selectedLogo}
                        alt="Logo Preview"
                        className="mt-2 h-24 w-24 object-cover rounded-md"
                      />
                    ) : (
                      selectedSchool?.logoUrl && (
                        <img
                          src={selectedSchool.logoUrl}
                          alt="Current Logo"
                          className="mt-2 h-24 w-24 object-cover rounded-md"
                        />
                      )
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Banner
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(e, setSelectedBanner)}
                      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    {selectedBanner ? (
                      <img
                        src={selectedBanner}
                        alt="Banner Preview"
                        className="mt-2 h-24 w-full object-cover rounded-md"
                      />
                    ) : (
                      selectedSchool?.bannerUrl && (
                        <img
                          src={selectedSchool.bannerUrl}
                          alt="Current Banner"
                          className="mt-2 h-24 w-full object-cover rounded-md"
                        />
                      )
                    )}
                  </div>
                  <Input
                    isRequired
                    label="Description"
                    name="description"
                    defaultValue={selectedSchool?.description}
                    placeholder="Enter school description"
                    variant="bordered"
                  />
                  <Input
                    isRequired
                    label="Location"
                    name="location"
                    defaultValue={selectedSchool?.location}
                    placeholder="Enter school location"
                    variant="bordered"
                  />
                  <div className="flex justify-end gap-2">
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancel
                    </Button>
                    <Button color="primary" type="submit">
                      Update School
                    </Button>
                  </div>
                </Form>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete School Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Delete School</ModalHeader>
              <ModalBody>
                Are you sure you want to delete the school "
                {selectedSchool?.name}"?
              </ModalBody>
              <ModalFooter>
                <Button color="danger" onPress={handleDelete}>
                  Delete
                </Button>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
