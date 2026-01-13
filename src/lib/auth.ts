import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export const ensureAuthPersistence = () =>
  setPersistence(firebaseAuth, browserLocalPersistence);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(firebaseAuth, email, password);

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(firebaseAuth, email, password);

export const signOut = () => firebaseSignOut(firebaseAuth);

export const deleteAccount = async () => {
  if (!firebaseAuth.currentUser) {
    throw new Error("No authenticated user to delete.");
  }

  return deleteUser(firebaseAuth.currentUser);
};

export const onAuthStateChangedListener = (callback: (user: User | null) => void) =>
  onAuthStateChanged(firebaseAuth, callback);
