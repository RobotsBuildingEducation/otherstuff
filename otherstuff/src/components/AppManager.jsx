import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNostr } from "../hooks/useNostr"; // Import the useNostr hook
import { database } from "../database/database";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

export const AppManager = () => {
  const [hasAccess, setHasAccess] = useState(false); // State to track access
  const [loading, setLoading] = useState(true); // State to track loading
  const [error, setError] = useState(""); // State to track error message
  const [submittedApps, setSubmittedApps] = useState([]); // State to store submitted apps
  const { auth } = useNostr(); // Use the auth function from the hook

  // Authenticate the user
  useEffect(() => {
    const authenticateUser = async () => {
      const storedNsec = localStorage.getItem("local_nsec");

      if (!storedNsec) {
        setError("Access denied: No credentials found.");
        setLoading(false);
        return;
      }

      try {
        const { npub } = auth(storedNsec); // Authenticate using stored nsec
        if (
          npub ===
          "npub14vskcp90k6gwp6sxjs2jwwqpcmahg6wz3h5vzq0yn6crrsq0utts52axlt"
        ) {
          setHasAccess(true);
          await fetchSubmittedApps(); // Fetch submitted apps if access is granted
        } else {
          setError("Access denied: Invalid credentials.");
        }
      } catch (err) {
        console.error("Authentication error:", err);
        setError("Access denied: Authentication failed.");
      } finally {
        setLoading(false);
      }
    };

    authenticateUser();
  }, [auth]);

  // Fetch submitted apps from the "SubmittedApps" collection
  const fetchSubmittedApps = async () => {
    try {
      const appsCollectionRef = collection(database, "SubmittedApps");
      const appsSnapshot = await getDocs(appsCollectionRef);
      const appsData = appsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubmittedApps(appsData);
    } catch (error) {
      console.error("Error fetching submitted apps:", error);
      setError("Failed to fetch submitted apps.");
    }
  };

  // Handle verifying an app
  const handleVerifyApp = async (app) => {
    try {
      // Move the app to the "VerifiedApps" collection
      const verifiedAppsCollectionRef = collection(database, "VerifiedApps");
      const appDocRef = doc(verifiedAppsCollectionRef, app.id);
      await setDoc(appDocRef, app);

      // Remove the app from the "SubmittedApps" collection
      const submittedAppsCollectionRef = collection(database, "SubmittedApps");
      const submittedAppDocRef = doc(submittedAppsCollectionRef, app.id);
      await deleteDoc(submittedAppDocRef);

      // Update the local state
      setSubmittedApps((prev) => prev.filter((a) => a.id !== app.id));
    } catch (error) {
      console.error("Error verifying app:", error);
      alert("Failed to verify app. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box mt={20} textAlign="center">
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (!hasAccess) {
    return (
      <Box mt={20} textAlign="center">
        <Heading as="h1" size="lg" color="red.500">
          Access Denied
        </Heading>
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <Box mt={20}>
      <Heading as="h1" size="xl" mb={4}>
        App Manager
      </Heading>
      <Text>Welcome to the App Manager dashboard!</Text>

      <Box mt={8}>
        <Heading as="h2" size="lg" mb={4}>
          Submitted Apps
        </Heading>
        {submittedApps.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {submittedApps.map((app) => (
              <Box
                key={app.id}
                p={4}
                border="1px solid"
                borderColor={useColorModeValue("gray.200", "gray.700")}
                borderRadius="md"
              >
                <Heading as="h3" size="md" mb={2}>
                  {app.name}
                </Heading>
                <Text>Category: {app.categories?.join(", ")}</Text>
                <Text>Description: {app.description}</Text>
                <Text>Platforms: {app.platforms?.join(", ")}</Text>
                <HStack mt={4}>
                  <Button
                    colorScheme="green"
                    onClick={() => handleVerifyApp(app)}
                  >
                    Verify
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Text>No submitted apps available.</Text>
        )}
      </Box>
    </Box>
  );
};
