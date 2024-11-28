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
import { useNostr } from "../hooks/useNostr";
import { database } from "../database/database";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { AppPage } from "./AppPage";

export const AppManager = ({ submittedApps, setSubmittedApps }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  //   const [submittedApps, setSubmittedApps] = useState([]);
  const { auth } = useNostr();
  const navigate = useNavigate();

  //   useEffect(() => {
  //     const authenticateUser = async () => {
  //       const storedNsec = localStorage.getItem("local_nsec");

  //       if (!storedNsec) {
  //         setError("Access denied: No credentials found.");
  //         setLoading(false);
  //         return;
  //       }

  //       try {
  //         const { npub } = auth(storedNsec);
  //         if (
  //           npub ===
  //           "npub14vskcp90k6gwp6sxjs2jwwqpcmahg6wz3h5vzq0yn6crrsq0utts52axlt"
  //         ) {
  //           setHasAccess(true);
  //           await fetchSubmittedApps();
  //         } else {
  //           setError("Access denied: Invalid credentials.");
  //         }
  //       } catch (err) {
  //         console.error("Authentication error:", err);
  //         setError("Access denied: Authentication failed.");
  //       } finally {
  //         setLoading(false);
  //       }
  //     };

  //     authenticateUser();
  //   }, []);

  //   const fetchSubmittedApps = async () => {
  //     try {
  //       const appsCollectionRef = collection(database, "SubmittedApps");
  //       const appsSnapshot = await getDocs(appsCollectionRef);
  //       const appsData = appsSnapshot.docs.map((doc) => ({
  //         id: doc.id,
  //         ...doc.data(),
  //       }));
  //       setSubmittedApps(appsData);
  //     } catch (error) {
  //       console.error("Error fetching submitted apps:", error);
  //       setError("Failed to fetch submitted apps.");
  //     }
  //   };

  const handleVerifyApp = async (app) => {
    try {
      const verifiedAppsCollectionRef = collection(database, "VerifiedApps");
      const appDocRef = doc(verifiedAppsCollectionRef, app.id);
      await setDoc(appDocRef, app);

      const submittedAppsCollectionRef = collection(database, "SubmittedApps");
      const submittedAppDocRef = doc(submittedAppsCollectionRef, app.id);
      await deleteDoc(submittedAppDocRef);

      setSubmittedApps((prev) => prev.filter((a) => a.id !== app.id));
    } catch (error) {
      console.error("Error verifying app:", error);
      alert("Failed to verify app. Please try again.");
    }
  };

  const handleViewApp = (app) => {
    const formattedAppName = app.name.toLowerCase().split(" ").join("-");
    navigate(`/${app.npub || app.submittedBy}/${formattedAppName}`);
  };

  //   if (loading) {
  //     return (
  //       <Box mt={20} textAlign="center">
  //         <Text>Loading...</Text>
  //       </Box>
  //     );
  //   }

  //   if (!hasAccess) {
  //     return (
  //       <Box mt={20} textAlign="center">
  //         <Heading as="h1" size="lg" color="red.500">
  //           Access Denied
  //         </Heading>
  //         <Text>{error}</Text>
  //       </Box>
  //     );
  //   }

  return (
    <>
      <Routes>
        {submittedApps.map((app) => (
          <Route
            key={app.id}
            path={`/${app.npub || app.submittedBy}/${app.name
              .toLowerCase()
              .split(" ")
              .join("-")}`}
            element={<AppPage app={app} />}
          />
        ))}
      </Routes>
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
                  <HStack mt={4} spacing={4}>
                    <Button
                      colorScheme="green"
                      onClick={() => handleVerifyApp(app)}
                    >
                      Verify
                    </Button>
                    <Button
                      as={Link}
                      to={`/${app.npub || app.submittedBy}/${app.name
                        .toLowerCase()
                        .split(" ")
                        .join("-")}`} // Generate route from name
                      colorScheme="blue"
                      variant="outline"
                      //   onClick={() => handleViewApp(app)}
                    >
                      View
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
    </>
  );
};
