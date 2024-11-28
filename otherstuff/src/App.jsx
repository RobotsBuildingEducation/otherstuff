import { useState, useEffect } from "react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { MdStar } from "react-icons/md";
import { FaGithub, FaUserCircle, FaHome } from "react-icons/fa";
import { useLocation, useParams } from "react-router-dom";
import debounce from "lodash/debounce";
import { AppCard } from "./components/AppCard";
import { apps } from "./utils/content";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Checkbox,
  Switch,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue,
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  Button,
  Text,
  Badge,
  Flex,
  Divider,
} from "@chakra-ui/react";
import { SearchIcon, HamburgerIcon } from "@chakra-ui/icons";
import { AppPage } from "./components/AppPage";
import { useNostr } from "./hooks/useNostr";
import { ProfilePage } from "./components/ProfilePage";
import { database } from "./database/database";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { AppManager } from "./components/AppManager";

export const App = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { generateNostrKeys, auth, nostrPubKey, nostrPrivKey, fetchProfile } =
    useNostr(
      localStorage.getItem("local_npub"),
      localStorage.getItem("local_nsec")
    );

  const [searchTerm, setSearchTerm] = useState("");
  const [allApps, setAllApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    web: false,
    android: false,
    ios: false,
    desktop: false,
  });
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [nsecInput, setNsecInput] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(!!nostrPubKey);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();

  const isMobile = useBreakpointValue({ base: true, md: false });
  const { colorMode, toggleColorMode } = useColorMode();

  const getCategoryStats = () => {
    const stats = {};
    allApps.forEach((app) => {
      if (app.categories) {
        app.categories.forEach((category) => {
          stats[category] = (stats[category] || 0) + 1;
        });
      }
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  };

  useEffect(() => {
    const fetchVerifiedApps = async () => {
      try {
        const verifiedAppsRef = collection(database, "VerifiedApps");
        const querySnapshot = await getDocs(verifiedAppsRef);
        const verifiedApps = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          isVerified: true,
        }));

        const combinedApps = [...verifiedApps, ...apps];
        setAllApps(combinedApps);
        setFilteredApps(combinedApps);
      } catch (error) {
        console.error("Error fetching verified apps:", error);
      }
    };

    fetchVerifiedApps();
  }, []);

  useEffect(() => {
    const filterApps = () => {
      const lowerSearch = searchTerm.toLowerCase();
      const result = allApps.filter((app) => {
        const matchesSearch =
          app.name?.toLowerCase().includes(lowerSearch) ||
          app.description?.toLowerCase().includes(lowerSearch) ||
          app.categories?.some((category) =>
            category.toLowerCase().includes(lowerSearch)
          );

        const matchesPlatform =
          !Object.values(selectedPlatforms).some((v) => v) ||
          (selectedPlatforms.web && app.platforms?.includes("web")) ||
          (selectedPlatforms.android && app.platforms?.includes("android")) ||
          (selectedPlatforms.ios && app.platforms?.includes("ios")) ||
          (selectedPlatforms.desktop && app.platforms?.includes("desktop"));

        const matchesCategory =
          !selectedCategory || app.categories?.includes(selectedCategory);

        return matchesSearch && matchesPlatform && matchesCategory;
      });
      setFilteredApps(result);
    };

    filterApps();
  }, [searchTerm, selectedPlatforms, selectedCategory, allApps]);

  const spotlightApp = filteredApps.find((app) => app.isSpotlight);
  const otherApps = filteredApps.filter((app) => !app.isSpotlight);

  const handleSearch = debounce((value) => {
    setSearchTerm(value);
  }, 300);

  const handlePlatformChange = (platform) => {
    setSelectedPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  const handleCreateUser = async (event = null, npubRef = null) => {
    if (npubRef) {
      const userDoc = doc(database, "users", npubRef);

      await setDoc(userDoc, {
        npub: npubRef,
        createdAt: new Date(),
      });

      setIsSignedIn(true);
    } else {
      try {
        const { npub, nsec } = await generateNostrKeys();
        const userDoc = doc(database, "users", npub);

        await setDoc(userDoc, {
          npub,
          createdAt: new Date(),
        });

        localStorage.setItem("local_npub", npub);
        localStorage.setItem("local_nsec", nsec);

        setIsSignedIn(true);
      } catch (error) {
        console.error("Error creating user:", error);
      }
    }
  };

  const handleSignIn = async () => {
    try {
      const { npub } = await auth(nsecInput);
      const userDoc = doc(database, "users", npub);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        console.log("User data:", userSnapshot.data());
        localStorage.setItem("local_npub", npub);
        localStorage.setItem("local_nsec", nsecInput);
        setIsSignedIn(true);
      } else {
        console.log("No such user. Creating new user...");
        await handleCreateUser(null, npub);
      }
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleFetchProfile = async () => {
    const npub = localStorage.getItem("local_npub");
    if (npub) {
      onModalClose();
      navigate(`/profile/${npub}`);
    } else {
      console.log("No public key available.");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("local_npub");
    localStorage.removeItem("local_nsec");
    setIsSignedIn(false);
    onModalClose();
    navigate("/");
  };

  return (
    <Box p={4} minHeight="100vh">
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        zIndex="1000"
        boxShadow="md"
        p={4}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor={colorMode === "dark" ? "#120c1f" : "white"}
      >
        {pathname === "/" ? (
          <IconButton
            aria-label="Menu"
            icon={<HamburgerIcon />}
            variant="outline"
            onClick={onOpen}
            mr={2}
          />
        ) : null}
        {!isMobile && pathname === "/" && (
          <Box display="flex" gap={4}>
            {["web", "android", "ios", "desktop"].map((platform) => (
              <Checkbox
                key={platform}
                isChecked={selectedPlatforms[platform]}
                onChange={() => handlePlatformChange(platform)}
              >
                {platform === "ios"
                  ? "iOS"
                  : platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Checkbox>
            ))}
          </Box>
        )}
        {pathname === "/" ? (
          <InputGroup flex="1" ml={4} mr={4} width="100%">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search apps..."
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>
        ) : null}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: pathname === "/" ? "min-content" : "100%",
          }}
        >
          <IconButton
            aria-label="Account"
            icon={<FaUserCircle />}
            variant="ghost"
            onClick={onModalOpen}
            fontSize="2xl"
          />
          &nbsp; &nbsp;
          <IconButton
            aria-label="Home"
            icon={<FaHome />}
            variant="ghost"
            onClick={() => navigate("/")}
            fontSize="2xl"
          />
        </div>
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader
            backgroundColor={colorMode === "dark" ? "#35304B" : "white"}
          >
            Menu
          </DrawerHeader>
          <DrawerBody
            backgroundColor={colorMode === "dark" ? "#35304B" : "white"}
          >
            <Box display="flex" alignItems="center" mb={4}>
              <Switch
                onChange={toggleColorMode}
                mr={2}
                size="lg"
                aria-label="Toggle theme"
              />
              {colorMode === "dark" ? (
                <MoonIcon boxSize={6} color="yellow.500" />
              ) : (
                <SunIcon boxSize={6} color="orange.400" />
              )}
            </Box>

            <Button
              leftIcon={<FaGithub />}
              background="black"
              color="white"
              width="100%"
              mt={4}
            >
              GitHub
            </Button>
            <Divider my={4} />

            <Text fontWeight="bold" mb={3}>
              Categories
            </Text>
            <VStack align="stretch" spacing={2}>
              {selectedCategory && (
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(null);
                    onClose();
                  }}
                  mb={2}
                >
                  Clear Filter
                </Button>
              )}
              {getCategoryStats().map(([category, count]) => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? "solid" : "outline"}
                  colorScheme={selectedCategory === category ? "blue" : "gray"}
                  onClick={() => {
                    setSelectedCategory(category);
                    // onClose();
                  }}
                >
                  <Flex justify="space-between" width="100%">
                    <Text>{category}</Text>
                    <Badge
                      ml={2}
                      colorScheme={
                        selectedCategory === category ? "white" : "gray"
                      }
                    >
                      {count}
                    </Badge>
                  </Flex>
                </Button>
              ))}
            </VStack>

            <Divider my={4} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={isModalOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isSignedIn && nostrPubKey ? (
              <VStack spacing={4} align="stretch">
                <Text>
                  <strong>Public Key (npub):</strong> {nostrPubKey}
                </Text>
                <Button onClick={handleFetchProfile}>Profile</Button>
                <Button onClick={handleSignOut} variant="outline">
                  Sign out
                </Button>
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                <Button
                  colorScheme="teal"
                  onClick={(event) => handleCreateUser(event, null)}
                  width="100%"
                >
                  Create user & keys
                </Button>

                <Text>or</Text>

                <Input
                  placeholder="Enter nsec"
                  value={nsecInput}
                  onChange={(e) => setNsecInput(e.target.value)}
                  mb={2}
                />
                <Button colorScheme="blue" onClick={handleSignIn}>
                  Sign In
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Routes>
        <Route
          path="/"
          element={
            <Box mt={20} px={4}>
              {spotlightApp && (
                <Box
                  mb={8}
                  display="flex"
                  justifyContent="center"
                  width="100%"
                  position="relative"
                >
                  <Box width={{ base: "100%", md: "50%" }} mx="auto">
                    <Box position="relative">
                      <Box
                        position="absolute"
                        top="-10px"
                        left="-10px"
                        backgroundColor="purple.500"
                        color="purple.200"
                        fontSize="xs"
                        fontWeight="bold"
                        px={2}
                        py={1}
                        borderRadius="full"
                        boxShadow="lg"
                        display="flex"
                        alignItems="center"
                        gap={1}
                        zIndex="1"
                      >
                        <MdStar size="16px" />
                      </Box>
                      <AppCard app={spotlightApp} isSpotlight />
                    </Box>
                  </Box>
                </Box>
              )}

              <Box
                display="grid"
                gridTemplateColumns={{
                  base: "repeat(2, 1fr)",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                  xl: "repeat(4, 1fr)",
                }}
                gap={4}
              >
                {otherApps.map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </Box>
            </Box>
          }
        />
        {allApps.map((app) => (
          <Route
            key={app.id}
            path={`/${app.npub || app.submittedBy}/${app.name
              .toLowerCase()
              .split(" ")
              .join("-")}`}
            element={<AppPage app={app} />}
          />
        ))}

        <Route
          path="/profile/:npub"
          element={<ProfilePage fetchProfile={fetchProfile} />}
        />
        <Route
          path="/manager"
          element={<AppManager fetchProfile={AppManager} />}
        />
      </Routes>
    </Box>
  );
};
