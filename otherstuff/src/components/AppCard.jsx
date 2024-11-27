import {
  Box,
  Heading,
  Text,
  Image,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { Link as RouterLink } from "react-router-dom"; // Import React Router's Link

export const AppCard = React.memo(({ app, isSpotlight }) => {
  const bg = useColorModeValue(
    "linear(to-r, #ffffff, #FFFFFD)",
    "linear(to-r, #120C1F, #1A202C)"
  );
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const descriptionColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Box
      as={RouterLink}
      to={`/${app.npub || app.submittedBy}/${app.name
        .toLowerCase()
        .split(" ")
        .join("-")}`} // Generate route from name
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="lg"
      boxShadow="md"
      overflow="hidden"
      bgGradient={bg}
      p={4}
      breakInside="avoid"
      _hover={{ boxShadow: "lg", transform: "scale(1.01)" }}
      transition="all 0.1s"
      display="block" // Make the entire box clickable
    >
      <Flex align="start" gap={4} flexDirection={{ base: "column", sm: "row" }}>
        <Image
          src={app.thumb}
          alt={`${app.name} thumbnail`}
          borderRadius="md"
          objectFit="cover"
          boxSize={{ base: "100%", sm: "120px" }}
          loading="lazy"
        />
        <Box flex="1">
          <Heading
            size="md"
            mb={2}
            noOfLines={1}
            fontSize={{ base: "lg", sm: "md", md: "lg" }}
            color={textColor}
          >
            {app.name}
          </Heading>
          <Text
            fontSize={{ base: "sm", md: "md" }}
            color={descriptionColor}
            // noOfLines={{ base: 3, md: 2 }}
          >
            {app.description}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
});
