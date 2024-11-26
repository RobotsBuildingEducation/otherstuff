import { useState, useEffect } from "react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons"; // Chakra's built-in icons
import { MdStar } from "react-icons/md"; // Import the star icon
import debounce from "lodash/debounce";
import { AppCard } from "./components/AppCard";
import { apps } from "./utils/content";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // React Router
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
  useColorMode, // Chakra hook for theme management
} from "@chakra-ui/react";
import { SearchIcon, HamburgerIcon } from "@chakra-ui/icons";
import { AppPage } from "./components/AppPage";

export const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState(apps);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    web: false,
    android: false,
    ios: false,
    desktop: false,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { colorMode, toggleColorMode } = useColorMode(); // Chakra's theme hook

  // Separate spotlight app and others
  const spotlightApp = apps.find((app) => app.isSpotlight);
  const otherApps = filteredApps.filter((app) => !app.isSpotlight);

  // Update filtered apps when search term or filters change
  useEffect(() => {
    const filterApps = () => {
      const lowerSearch = searchTerm.toLowerCase();
      const result = apps.filter((app) => {
        const matchesSearch =
          app.name?.toLowerCase().includes(lowerSearch) ||
          app.description?.toLowerCase().includes(lowerSearch) ||
          app.categories?.some((category) =>
            category.toLowerCase().includes(lowerSearch)
          );

        const matchesPlatform =
          !Object.values(selectedPlatforms).some((v) => v) ||
          (selectedPlatforms.web && app.platforms.includes("web")) ||
          (selectedPlatforms.android && app.platforms.includes("android")) ||
          (selectedPlatforms.ios && app.platforms.includes("ios")) ||
          (selectedPlatforms.desktop && app.platforms.includes("desktop"));

        return matchesSearch && matchesPlatform;
      });
      setFilteredApps(result);
    };

    filterApps();
  }, [searchTerm, selectedPlatforms]);

  const handleSearch = debounce((value) => {
    setSearchTerm(value);
  }, 300);

  const handlePlatformChange = (platform) => {
    setSelectedPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  return (
    <Router>
      <Box p={4} minHeight="100vh">
        {/* Top Navigation */}
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
          <IconButton
            aria-label="Menu"
            icon={<HamburgerIcon />}
            variant="outline"
            onClick={onOpen}
            mr={2}
          />

          {!isMobile && (
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

          <InputGroup flex="1" ml={4}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search apps..."
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>
        </Box>

        {/* Sidebar Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Menu</DrawerHeader>
            <DrawerBody>
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

              {isMobile &&
                ["web", "android", "ios", "desktop"].map((platform) => (
                  <Checkbox
                    key={platform}
                    isChecked={selectedPlatforms[platform]}
                    onChange={() => handlePlatformChange(platform)}
                    mt={4}
                    width="100%"
                  >
                    {platform === "ios"
                      ? "iOS"
                      : platform.charAt(0).toUpperCase() +
                        platform.slice(1)}{" "}
                  </Checkbox>
                ))}
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Routes */}
        <Routes>
          {/* Main Content Route */}
          <Route
            path="/"
            element={
              <Box mt={20} px={4}>
                {/* Spotlight App */}
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

                {/* Other Apps */}
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
          {/* App Detail Routes */}
          {apps.map((app) => (
            <Route
              key={app.id}
              path={`/${app.name.toLowerCase().split(" ").join("-")}`}
              element={<AppPage app={app} />}
            />
          ))}
        </Routes>
      </Box>
    </Router>
  );
};
