import {
  Box,
  Heading,
  Text,
  Image,
  Flex,
  useColorModeValue,
  Stack,
  Badge,
  Link,
  SimpleGrid,
  VStack,
  textDecoration,
  Input,
  Button,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import React, { useEffect, useState } from "react";

export const AppPage = ({ app }) => {
  const textColor = useColorModeValue("gray.800", "white");
  const descriptionColor = useColorModeValue("gray.600", "gray.300");
  // const featureColor = useColorModeValue(".600", "teal.300");
  const galleryBorderColor = useColorModeValue("gray.200", "gray.700");

  const [passcode, setPasscode] = useState("");
  const [hasAccess, setHasAccess] = useState(() => {
    return localStorage.getItem(`global_app_access`) === "true";
  });

  const handlePasscodeChange = (e) => {
    const value = e.target.value;
    const correctPasscode = import.meta.env.VITE_APP_PASSCODE;
    if (value === correctPasscode) {
      localStorage.setItem(`global_app_access`, "true");
      setHasAccess(true);
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <Box p={8} mt={20}>
      <Flex
        flexDirection={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        gap={8}
      >
        {/* App Thumbnail */}
        <Image
          src={app.thumb}
          alt={`${app.name} thumbnail`}
          borderRadius="lg"
          objectFit="cover"
          boxSize={{ base: "100%", md: "200px" }}
          shadow="lg"
        />

        {/* App Details */}
        <Box flex="1">
          <Heading color={textColor} mb={4}>
            {app.name}
          </Heading>

          <Text color={descriptionColor} fontSize="lg" mb={4}>
            {app.description}
          </Text>

          {/* Platforms */}
          <Stack direction="row" align="center" wrap="wrap" mb={4}>
            {app.platforms.map((platform) => (
              <Badge
                key={platform}
                colorScheme="teal"
                variant="subtle"
                fontSize="sm"
                px={3}
                py={1}
                rounded="full"
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Badge>
            ))}
          </Stack>

          {/* External Link */}

          {hasAccess ? (
            <Link
              href={app.url}
              color="blue.400"
              fontWeight="bold"
              isExternal
              fontSize="lg"
            >
              Launch app
            </Link>
          ) : (
            <Flex mt={4} flexDir={"column"}>
              <b> Enter subscriber passcode to unlock access to app</b>
              <Input
                placeholder="Enter passcode"
                onChange={handlePasscodeChange}
                mt={4}
                type="password"
              />
            </Flex>
          )}
        </Box>
      </Flex>
      {/* {app.npub || app.submittedBy ? (
        <Box mt={8}>
          <Heading size="md" color={textColor} mb={2}>
            Creator
          </Heading>
          <RouterLink
            // href={`https://primal.net/p/${app.npub || app.submittedBy}`}
            to={`/profile/${app.npub || app.submittedBy}`}
            color="blue.400"
            fontWeight="bold"
            isExternal
            fontSize="lg"
            style={{ textDecoration: "underline", color: "#4287f5" }}
          >
            Creator's page
          </RouterLink>
        </Box>
      ) : null} */}

      {/* Features Section */}
      <Box mt={8}>
        <Heading size="md" color={textColor} mb={4}>
          Features
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {app.features.map((feature, index) => (
            <Box
              key={index}
              bg={useColorModeValue("gray.50", "gray.800")}
              p={4}
              rounded="md"
              shadow="sm"
              borderWidth="1px"
              borderColor={useColorModeValue("gray.200", "gray.600")}
            >
              <Text fontWeight="semibold" mb={2}>
                {feature}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* Gallery Section */}
      {app.gallery?.length > 0 && (
        <Box mt={8}>
          <Heading size="md" color={textColor} mb={4}>
            Gallery
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {app.gallery.map((image, index) => (
              <Box
                key={index}
                borderWidth="1px"
                borderColor={galleryBorderColor}
                rounded="lg"
                overflow="hidden"
                shadow="sm"
                borderRadius="35px"
              >
                <Image
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  objectFit="cover"
                  width="100%"
                  height="100%"
                />
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Nostr Information */}
    </Box>
  );
};
