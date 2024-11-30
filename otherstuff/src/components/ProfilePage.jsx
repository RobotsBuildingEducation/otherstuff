import React, { useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty";
import { CgWebsite } from "react-icons/cg";
import { FiAtSign } from "react-icons/fi";
import { PiLightning } from "react-icons/pi";

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
  FormLabel,
  FormControl,
  Link,
  Image,
  Collapse,
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
import { FaEye } from "react-icons/fa";
import { AppCard } from "./AppCard";

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
  const [isCardOpen, setIsCardOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCardOpen(!isCardOpen);
  };

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
      let appId;
      const userDocRef = doc(database, "users", npub);
      const userAppsCollectionRef = collection(userDocRef, "apps");

      if (editingAppId) {
        // If editing, use existing ID
        appId = editingAppId;
        const userAppDocRef = doc(userAppsCollectionRef, appId);
        await setDoc(userAppDocRef, appDoc);
      } else {
        // For new apps, let Firebase generate the ID
        const userAppDocRef = await addDoc(userAppsCollectionRef, appDoc);
        appId = userAppDocRef.id;
      }

      // Use the same ID across collections
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

      // Update/Create in SubmittedApps using the same ID
      await setDoc(submittedAppDocRef, appDoc);

      // Refresh apps list
      const appsSnapshot = await getDocs(userAppsCollectionRef);
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

  console.log("profile", profile);
  return (
    <Box p={4} mt={20}>
      <Box>
        {profile ? (
          <>
            {/* <Text fontSize="lg">Profile Details</Text> */}

            <Box borderRadius="md" mb={4}>
              <>
                {/* Render the name field first, if it exists */}

                {/* Render the image field second, if it exists */}
                {"image" in profile && profile.image && (
                  <Image
                    loading="eager"
                    style={{ borderRadius: "25%" }}
                    src={profile.image}
                    width="200px"
                    alt="Profile"
                    mb={1}
                  />
                )}

                {"name" in profile && profile.name && (
                  <Box mb={2} display="flex">
                    <Text>{profile.name}</Text>
                  </Box>
                )}

                {"lud16" in profile && profile.lud16 && (
                  <Box display="flex" alignItems={"center"} fontSize="sm">
                    <PiLightning />
                    &nbsp;
                    <Text>{profile.lud16}</Text>
                  </Box>
                )}

                <Text fontSize="sm" display="flex" alignItems={"center"}>
                  {"website" in profile && profile.website && (
                    <>
                      <CgWebsite />
                      <Link
                        href={profile.website}
                        color="blue.400"
                        fontWeight="bold"
                        isExternal
                        fontSize="sm"
                        display="flex"
                      >
                        &nbsp;public website
                      </Link>
                    </>
                  )}
                </Text>

                <Text fontSize="sm" mb={4} display="flex" alignItems={"center"}>
                  <FiAtSign />
                  <Link
                    href={`https://primal.net/p/${npub}`}
                    color="blue.400"
                    fontWeight="bold"
                    isExternal
                    fontSize="sm"
                  >
                    &nbsp;social network
                  </Link>
                </Text>

                <Text fontSize="sm">
                  <b>About</b>
                  <br />
                  {"about" in profile && profile.about && <>{profile.about}</>}
                </Text>
                {/* Render the rest of the fields
                <Button
                  size="sm"
                  onClick={toggleCollapse}
                  mb={2}
                  variant={"outline"}
                >
                  {isCardOpen ? `Hide profile details` : `View profile details`}
                </Button> */}

                {/* Collapsible section */}
                {/* <Collapse in={isCardOpen} animateOpacity>
                  <Box mt={4}>
                    {Object.entries(profile).map(([key, value]) => {
                      if (
                        isEmpty(value) ||
                        key === "name" ||
                        key === "image" ||
                        key === "website" ||
                        key === "lud16"
                      ) {
                        return null; // Skip fields already displayed or irrelevant
                      }
                      return (
                        <Box key={key} mb={2}>
                          <Text fontWeight="bold">{key}</Text>
                          <Text>{value}</Text>
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse> */}
              </>
            </Box>
          </>
        ) : (
          <Text>Loading profile data...</Text>
        )}
      </Box>

      <Box mt={6}>
        <Text fontSize="lg">Submitted Apps</Text>
        {localStorage.getItem("local_npub") === npub && (
          <Button
            colorScheme="purple"
            onClick={() => {
              setEditingAppId(null);
              setFormState(INITIAL_FORM_STATE);
              onOpen();
            }}
          >
            Submit New App
          </Button>
        )}
        <br /> <br />
        {apps.length > 0 ? (
          apps.map((app) => (
            <Box
              key={app.id}
              // border="1px solid gray"
              borderRadius="md"
              mb={4}
            >
              <HStack justify="space-between">
                {/* <VStack align="start" spacing={2}>
                  <Text fontWeight="bold">{app.name}</Text>
                  <Text>Category: {app.categories?.join(", ")}</Text>
                  <Text>Features: {app.features?.join(", ")}</Text>
                  <Text>Platforms: {app.platforms?.join(", ")}</Text>
                </VStack> */}
                <div style={{ textAlign: "center", maxWidth: "100%" }}>
                  {/* <Text
                    // as={Link}
                    // to={`/${app.npub || app.submittedBy}/${app.name
                    //   .toLowerCase()
                    //   .split(" ")
                    //   .join("-")}`} // Generate route from name
                    variant="none"
                  >
                    Preview
                  </Text> */}
                  <AppCard key={app.id} app={app} />
                </div>
                {localStorage.getItem("local_npub") === npub && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "center",
                    }}
                  >
                    Edit
                    <IconButton
                      icon={<EditIcon />}
                      onClick={() => handleEditApp(app)}
                      colorScheme="gray"
                    />
                  </div>
                )}
              </HStack>
              <br />
              <hr />
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
            <FormControl>
              <VStack spacing={4} align="stretch">
                <div>
                  <FormLabel htmlFor="appName">Name</FormLabel>
                  <Input
                    placeholder="App Name"
                    name="appName"
                    value={formState.appName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <FormLabel htmlFor="url">App URL</FormLabel>
                  <Input
                    placeholder="URL"
                    name="url"
                    value={formState.url}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <Textarea
                    placeholder="Description"
                    name="description"
                    value={formState.description || ""}
                    onChange={handleInputChange}
                    size="sm"
                    resize="vertical"
                  />
                </div>
                <div>
                  <FormLabel htmlFor="category">Categories</FormLabel>
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
                </div>

                <div>
                  {formState.category === "createNew" && (
                    <>
                      <FormLabel htmlFor="newCategory">New Category</FormLabel>
                      <Input
                        placeholder="New Category"
                        name="newCategory"
                        value={formState.newCategory}
                        onChange={handleInputChange}
                      />
                    </>
                  )}
                </div>
                <div>
                  <FormLabel htmlFor="thumb">Thumbnail URL</FormLabel>
                  <Input
                    placeholder="Thumbnail URL"
                    name="thumb"
                    value={formState.thumb}
                    onChange={handleInputChange}
                  />
                </div>
                <br />
                <div>
                  <FormLabel htmlFor="images">
                    Gallery Image URLs (Max 10)
                  </FormLabel>
                  <FormArray
                    name="images"
                    title="Images"
                    array={formState.images}
                    onAdd={() => handleAddToArray("images", 10)}
                    onRemove={(index) => handleRemoveFromArray("images", index)}
                    onChange={(index, value) =>
                      handleArrayChange("images", index, value)
                    }
                  />
                </div>

                <div>
                  <FormArray
                    name="features"
                    title="Features"
                    array={formState.features}
                    onAdd={() => handleAddToArray("features", 20)}
                    onRemove={(index) =>
                      handleRemoveFromArray("features", index)
                    }
                    onChange={(index, value) =>
                      handleArrayChange("features", index, value)
                    }
                  />
                </div>
                <div>
                  <FormLabel htmlFor="platforms">Platforms</FormLabel>
                  <HStack wrap="wrap" spacing={2}>
                    {["Web", "Desktop", "Mobile", "Android"].map((platform) => (
                      <Button
                        name="platforms"
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
                </div>
              </VStack>
            </FormControl>
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
