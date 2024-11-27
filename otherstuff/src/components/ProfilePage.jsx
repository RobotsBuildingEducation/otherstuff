import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Button,
  VStack,
  Input,
  Textarea,
  Select,
  HStack,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { useParams } from "react-router-dom";
import { database } from "../database/database";
import {
  doc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";

const INITIAL_FORM_STATE = {
  appName: "",
  thumb: "",
  category: "",
  newCategory: "",
  images: [""],
  features: [""],
  platforms: [],
  description: "",
  url: "",
};

export const ProfilePage = ({ fetchProfile, existingCategories = [] }) => {
  const { npub } = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState(existingCategories);
  const [editingAppId, setEditingAppId] = useState(null);

  // Fetch user profile and apps
  useEffect(() => {
    const fetchData = async () => {
      if (!npub) return;

      const profileData = await fetchProfile(npub);
      setProfile(profileData);

      const userDocRef = doc(database, "users", npub);
      const appsCollectionRef = collection(userDocRef, "apps");
      const appsSnapshot = await getDocs(appsCollectionRef);

      setApps(appsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, [npub, fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddToArray = (key, maxLimit) => {
    setFormState((prev) => {
      if (prev[key].length < maxLimit) {
        return { ...prev, [key]: [...prev[key], ""] };
      }
      return prev;
    });
  };

  const handleRemoveFromArray = (key, index) => {
    setFormState((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleArrayChange = (key, index, value) => {
    setFormState((prev) => {
      const updatedArray = [...prev[key]];
      updatedArray[index] = value;
      return { ...prev, [key]: updatedArray };
    });
  };

  const handlePlatformToggle = (platform) => {
    setFormState((prev) => {
      const updatedPlatforms = prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform];
      return { ...prev, platforms: updatedPlatforms };
    });
  };

  const handleEditApp = (app) => {
    setEditingAppId(app.id);
    setFormState({
      appName: app.name,
      thumb: app.thumb,
      category: app.categories[0],
      images: app.gallery || [""],
      features: app.features || [""],
      platforms: app.platforms || [],
      description: app.description || "",
      url: app.url || "",
    });
    onOpen();
  };

  const generateAppId = (appName, npub) => {
    // Create a standardized ID format that will be consistent across collections
    return `${appName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}-${npub.substring(0, 8)}`;
  };

  const handleSubmitApp = async () => {
    const {
      appName,
      category,
      newCategory,
      images,
      features,
      platforms,
      description,
      url,
      thumb,
    } = formState;

    // Validation
    if (
      !appName ||
      (!category && !newCategory) ||
      !images.length ||
      !platforms.length
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const finalCategory = category === "createNew" ? newCategory : category;

    // Construct app document
    const appDoc = {
      name: appName,
      categories: [finalCategory],
      description,
      gallery: images,
      features,
      platforms,
      thumb,
      url,
      updatedAt: new Date(),
      submittedBy: npub,
    };

    setIsSubmitting(true);

    try {
      const appId = editingAppId || generateAppId(appName, npub);
      const userDocRef = doc(database, "users", npub);
      const userAppDocRef = doc(collection(userDocRef, "apps"), appId);
      const submittedAppDocRef = doc(database, "SubmittedApps", appId);
      const verifiedAppDocRef = doc(database, "VerifiedApps", appId);

      // If editing, check if app was verified
      if (editingAppId) {
        const verifiedAppSnapshot = await getDoc(verifiedAppDocRef);
        if (verifiedAppSnapshot.exists()) {
          // Remove from VerifiedApps if it exists there
          await deleteDoc(verifiedAppDocRef);
        }
      }

      // Update/Create in user's subcollection
      await setDoc(userAppDocRef, appDoc);

      // Update/Create in SubmittedApps
      await setDoc(submittedAppDocRef, appDoc);

      // Refresh apps list
      const appsSnapshot = await getDocs(collection(userDocRef, "apps"));
      setApps(appsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      setFormState(INITIAL_FORM_STATE);
      setEditingAppId(null);
      onClose();
    } catch (error) {
      console.error("Error submitting app:", error);
      alert("Failed to submit app. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={4} mt={20}>
      <Text fontSize="xl" mb={4}>
        Profile for {npub}
      </Text>

      {localStorage.getItem("local_npub") === npub && (
        <Button
          colorScheme="teal"
          onClick={() => {
            setEditingAppId(null);
            setFormState(INITIAL_FORM_STATE);
            onOpen();
          }}
        >
          Submit New App
        </Button>
      )}

      <Box mt={6}>
        <Text fontSize="lg">Profile Details:</Text>
        {profile ? (
          <Box p={4} border="1px solid gray" borderRadius="md" mb={4}>
            {Object.entries(profile).map(([key, value]) => (
              <Box key={key} mb={2}>
                <Text fontWeight="bold">{key}:</Text>
                <Text>{value}</Text>
              </Box>
            ))}
          </Box>
        ) : (
          <Text>Loading profile data...</Text>
        )}
      </Box>

      <Box mt={6}>
        <Text fontSize="lg">Submitted Apps:</Text>
        {apps.length > 0 ? (
          apps.map((app) => (
            <Box
              key={app.id}
              p={4}
              border="1px solid gray"
              borderRadius="md"
              mb={4}
            >
              <HStack justify="space-between">
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold">{app.name}</Text>
                  <Text>Category: {app.categories?.join(", ")}</Text>
                  <Text>Features: {app.features?.join(", ")}</Text>
                  <Text>Platforms: {app.platforms?.join(", ")}</Text>
                </VStack>
                {localStorage.getItem("local_npub") === npub && (
                  <IconButton
                    icon={<EditIcon />}
                    onClick={() => handleEditApp(app)}
                    colorScheme="blue"
                  />
                )}
              </HStack>
            </Box>
          ))
        ) : (
          <Text>No apps submitted yet.</Text>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingAppId ? "Edit App" : "Submit App"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Input
                placeholder="App Name"
                name="appName"
                value={formState.appName}
                onChange={handleInputChange}
              />
              <Input
                placeholder="URL"
                name="url"
                value={formState.url}
                onChange={handleInputChange}
              />
              <Textarea
                placeholder="Description"
                name="description"
                value={formState.description || ""}
                onChange={handleInputChange}
                size="sm"
                resize="vertical"
              />
              <Select
                placeholder="Select Category"
                name="category"
                value={formState.category}
                onChange={handleInputChange}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="createNew">Create New Category</option>
              </Select>
              {formState.category === "createNew" && (
                <Input
                  placeholder="New Category"
                  name="newCategory"
                  value={formState.newCategory}
                  onChange={handleInputChange}
                />
              )}
              <Input
                placeholder="Thumbnail URL"
                name="thumb"
                value={formState.thumb}
                onChange={handleInputChange}
              />
              <FormArray
                title="Images (Max 10)"
                array={formState.images}
                onAdd={() => handleAddToArray("images", 10)}
                onRemove={(index) => handleRemoveFromArray("images", index)}
                onChange={(index, value) =>
                  handleArrayChange("images", index, value)
                }
              />
              <FormArray
                title="Features"
                array={formState.features}
                onAdd={() => handleAddToArray("features", 20)}
                onRemove={(index) => handleRemoveFromArray("features", index)}
                onChange={(index, value) =>
                  handleArrayChange("features", index, value)
                }
              />
              <Text fontWeight="bold">Platforms:</Text>
              <HStack wrap="wrap" spacing={2}>
                {["Web", "Desktop", "Mobile", "Android"].map((platform) => (
                  <Button
                    key={platform}
                    variant={
                      formState.platforms.includes(platform)
                        ? "solid"
                        : "outline"
                    }
                    onClick={() => handlePlatformToggle(platform)}
                  >
                    {platform}
                  </Button>
                ))}
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="teal"
              onClick={handleSubmitApp}
              isLoading={isSubmitting}
            >
              {editingAppId ? "Update" : "Submit"}
            </Button>
            <Button variant="ghost" onClick={onClose} ml={2}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

const FormArray = ({ title, array, onAdd, onRemove, onChange }) => (
  <VStack align="stretch">
    <Text fontWeight="bold">{title}</Text>
    {array.map((item, index) => (
      <HStack key={index}>
        <Input value={item} onChange={(e) => onChange(index, e.target.value)} />
        <IconButton
          icon={<DeleteIcon />}
          onClick={() => onRemove(index)}
          size="sm"
          colorScheme="red"
        />
      </HStack>
    ))}
    <Button size="sm" onClick={onAdd}>
      Add {title.slice(0, -1)}
    </Button>
  </VStack>
);
