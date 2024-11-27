import { useState, useEffect } from "react";

import NDK, {
  NDKPrivateKeySigner,
  NDKKind,
  NDKEvent,
} from "@nostr-dev-kit/ndk";

import { Buffer } from "buffer";
import { bech32 } from "bech32";
import { getPublicKey, nip19 } from "nostr-tools";

export const useNostr = (initialNpub, initialNsec) => {
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [nostrPubKey, setNostrPubKey] = useState(initialNpub || "");
  const [nostrPrivKey, setNostrPrivKey] = useState(initialNsec || "");

  useEffect(() => {
    // Load keys from local storage if they exist
    const storedNpub = localStorage.getItem("local_npub");
    const storedNsec = localStorage.getItem("local_nsec");

    if (storedNpub) {
      setNostrPubKey(storedNpub);
    }

    if (storedNsec) {
      setNostrPrivKey(storedNsec);
    }
  }, []);

  const generateNostrKeys = async () => {
    const privateKeySigner = NDKPrivateKeySigner.generate();

    const privateKey = privateKeySigner.privateKey;
    const user = await privateKeySigner.user();

    const publicKey = user.npub;

    const encodedNsec = bech32.encode(
      "nsec",
      bech32.toWords(Buffer.from(privateKey, "hex"))
    );
    const encodedNpub = bech32.encode(
      "npub",
      bech32.toWords(Buffer.from(publicKey, "hex"))
    );

    setNostrPrivKey(encodedNsec);
    setNostrPubKey(publicKey);

    if (!localStorage.getItem("local_nsec")) {
      //Creating profile... 2/4
      await postNostrContent(
        JSON.stringify({
          name: "New User",
          about: "Created a new account on " + Date.now(),
          // profilePictureUrl:
          //   "https://image.nostr.build/c8d21fe8773d7c5ddf3d6ef73ffe76dbeeec881c131bfb59927ce0b8b71a5607.png",
          // // "https://primal.b-cdn.net/media-cache?s=o&a=1&u=https%3A%2F%2Fm.primal.net%2FKBLq.png",
        }),
        0,
        publicKey,
        encodedNsec
      );
    }

    // let profile = await user.fetchProfile();
    // console.log("profile", profile);

    localStorage.setItem("local_nsec", encodedNsec);
    localStorage.setItem("local_npub", publicKey);

    return { npub: publicKey, nsec: encodedNsec };
  };

  const connectToNostr = async (npubRef = null, nsecRef = null) => {
    const nsec = nsecRef || nostrPrivKey;
    const npub = npubRef || nostrPubKey;

    try {
      // Decode the nsec from Bech32
      const { words: nsecWords } = bech32.decode(nsec);
      const hexNsec = Buffer.from(bech32.fromWords(nsecWords)).toString("hex");

      // Decode the npub from Bech32
      const { words: npubWords } = bech32.decode(npub);
      const hexNpub = Buffer.from(bech32.fromWords(npubWords)).toString("hex");

      // Create a new NDK instance
      const ndkInstance = new NDK({
        explicitRelayUrls: [
          "wss://relay.damus.io",
          "wss://relay.primal.net",
          "wss://ditto.pub/relay",
        ],
      });

      // Connect to the relays
      await ndkInstance.connect();

      setIsConnected(true);

      // Return the connected NDK instance and signer
      return { ndkInstance, hexNpub, signer: new NDKPrivateKeySigner(hexNsec) };
    } catch (err) {
      console.error("Error connecting to Nostr:", err);
      setErrorMessage(err.message);
      return null;
    }
  };

  const auth = (nsecPassword) => {
    let testnsec = nsecPassword;

    let decoded = nip19.decode(testnsec);

    const pubkey = getPublicKey(decoded.data);

    const ndk = new NDK({
      explicitRelayUrls: [
        "wss://relay.damus.io",
        "wss://relay.primal.net",
        "wss://ditto.pub/relay",
      ],
    });

    let user = ndk.getUser({ pubkey: pubkey });
    console.log("get user", user);

    setNostrPrivKey(testnsec);
    setNostrPubKey(user.npub);

    localStorage.setItem("local_nsec", testnsec);
    localStorage.setItem("local_npub", user.npub);

    return { npub: user.npub, nsec: testnsec };
  };

  const postNostrContent = async (
    content,
    kind = NDKKind.Text,
    npubRef = null,
    nsecRef = null
  ) => {
    const connection = await connectToNostr(npubRef, nsecRef);
    if (!connection) return;

    const { ndkInstance, hexNpub, signer } = connection;

    const noteEvent = new NDKEvent(ndkInstance, {
      kind,
      tags: [],
      content: content,
      created_at: Math.floor(Date.now() / 1000),
      pubkey: hexNpub,
    });

    try {
      await noteEvent.sign(signer);
    } catch (error) {}

    try {
      await noteEvent.publish();
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchProfile = async (npubRef = null) => {
    const npub = npubRef || nostrPubKey;

    if (!npub) {
      console.error("Public key is required to fetch the profile.");
      return null;
    }

    try {
      // Decode the npub from Bech32
      const { words: npubWords } = bech32.decode(npub);
      const hexNpub = Buffer.from(bech32.fromWords(npubWords)).toString("hex");

      // Create a new NDK instance
      const ndkInstance = new NDK({
        explicitRelayUrls: [
          "wss://relay.damus.io",
          "wss://relay.primal.net",
          "wss://ditto.pub/relay",
        ],
      });

      // Connect to the relays
      await ndkInstance.connect();

      // Fetch metadata event (kind = 0)
      const user = ndkInstance.getUser({ hexpubkey: hexNpub });
      console.log("userrr", user);
      const profileEvent = await user.fetchProfile();
      console.log("profile event", profileEvent);
      if (profileEvent) {
        // const profile = JSON.parse(profileEvent.content);
        // console.log("Fetched profile:", profile);

        return profileEvent; // { name, about, picture, etc. }
      } else {
        console.warn("No profile metadata found for this user.");
        return null;
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      return null;
    }
  };

  return {
    isConnected,
    errorMessage,
    nostrPubKey,
    nostrPrivKey,
    generateNostrKeys,
    postNostrContent,
    auth,
    fetchProfile,
  };
};
