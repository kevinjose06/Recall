import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";

export async function login(email: string, pass: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  
  // Set the __session cookie so Next.js middleware can read it
  const token = await userCredential.user.getIdToken();
  document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
  
  return userCredential.user;
}

export async function logout() {
  await firebaseSignOut(auth);
  document.cookie = `__session=; path=/; max-age=0; SameSite=Lax; Secure`;
}

export async function reAuthAndChangePassword(currentPass: string, newPass: string) {
  if (!auth.currentUser?.email) throw new Error("No user logged in");
  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPass);
  await reauthenticateWithCredential(auth.currentUser, credential);
  await updatePassword(auth.currentUser, newPass);
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

