import { doc, setDoc, collection } from "firebase/firestore";
import { database } from "../database/database";
import { apps } from "./content";

/**
 * Create user documents with app subcollections
 * @param {Object[]} apps - Array of all apps to organize by user
 */
export const generateUsers = async () => {
  try {
    // Group apps by npub
    const appsByNpub = apps.reduce((acc, app) => {
      if (!app.npub) return acc;
      if (!acc[app.npub]) acc[app.npub] = [];
      acc[app.npub].push(app);
      return acc;
    }, {});

    // Create documents for each user and their apps
    for (const [npub, userApps] of Object.entries(appsByNpub)) {
      // Create main user document
      const userDocRef = doc(database, "users", npub);
      await setDoc(userDocRef, {
        npub,
        updatedAt: new Date(),
      });

      // Add each app to user's apps subcollection
      const appsCollectionRef = collection(userDocRef, "apps");
      for (const app of userApps) {
        const appDocRef = doc(
          appsCollectionRef,
          app.name.toLowerCase().replace(/[^a-z0-9]/g, "-")
        );
        await setDoc(appDocRef, {
          ...app,
          updatedAt: new Date(),
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating user documents:", error);
    return { success: false, error };
  }
};
