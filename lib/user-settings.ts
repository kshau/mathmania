import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const getUserSettings = async (userId: string) => {
  const userSettingsDocRef = doc(db, "userSettings", userId);
  const userSettingsDoc = await getDoc(userSettingsDocRef);
  return userSettingsDoc.data();
};

export const updateUserSettings = async (userId: string, settings: any) => {
  const userSettingsDocRef = doc(db, "userSettings", userId);
  await setDoc(userSettingsDocRef, settings, { merge: true });
};
