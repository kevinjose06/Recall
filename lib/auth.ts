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
  
  // Set the __session cookie via our server API endpoint to enforce HttpOnly security
  const token = await userCredential.user.getIdToken();
  await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  
  return userCredential.user;
}

export async function logout() {
  await firebaseSignOut(auth);
  await fetch("/api/session", {
    method: "DELETE",
  });
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

