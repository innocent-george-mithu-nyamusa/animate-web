/**
 * Firebase Authentication Service
 * Handles user authentication with Firebase Auth
 */

import { getAuth } from "firebase-admin/auth";
import { adminDb } from "./firebase-admin";

export class FirebaseAuthService {
  private auth = getAuth();
  private db = adminDb;

  /**
   * Create user document in Firestore for an already-authenticated user
   * This is called after the user is created via client-side Firebase Auth
   */
  async createUserDocument({
    uid,
    email,
    displayName,
  }: {
    uid: string;
    email: string;
    displayName?: string;
  }) {
    try {
      // Check if user document already exists
      const userRef = this.db.collection("users").doc(uid);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        console.log(`User document already exists for: ${uid}`);
        return {
          success: true,
          uid,
          email,
          alreadyExists: true,
        };
      }

      // Create user document in Firestore with free tier
      await userRef.set({
        uid,
        email,
        displayName,
        photoURL: null,
        provider: "email",
        subscription: {
          tier: "free",
          status: "active",
          startDate: new Date().toISOString(),
          endDate: null,
        },
        credits: {
          remaining: 3,
          total: 3,
          tier: "free",
          updatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`Successfully created user document: ${uid}`);

      return {
        success: true,
        uid,
        email,
        alreadyExists: false,
      };
    } catch (error: any) {
      console.error("Error creating user document:", error);
      throw new Error(
        error.message || "Failed to create user document"
      );
    }
  }

  /**
   * Create a new user with email and password
   * @deprecated Use client-side createUserWithEmailAndPassword + createUserDocument instead
   */
  async createUserWithEmail({
    email,
    password,
    displayName,
  }: {
    email: string;
    password: string;
    displayName?: string;
  }) {
    try {

      // Create user in Firebase Auth
      const userRecord = await this.auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      // Create user document in Firestore with free tier
      await this.db
        .collection("users")
        .doc(userRecord.uid)
        .set({
          uid: userRecord.uid,
          email,
          displayName,
          photoURL: null,
          provider: "email",
          subscription: {
            tier: "free",
            status: "active",
            startDate: new Date().toISOString(),
            endDate: null,
          },
          credits: {
            remaining: 3,
            total: 3,
            tier: "free",
            updatedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      console.log(`Successfully created user: ${userRecord.uid}`);

      return {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email,
      };
    } catch (error: any) {
      console.error("Error creating user:", error);

      // Handle specific Firebase Auth errors
      if (error.code === "auth/email-already-exists") {
        throw new Error("Email already in use");
      }
      if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      }
      if (error.code === "auth/weak-password") {
        throw new Error("Password is too weak");
      }

      throw new Error(
        error.message || "Failed to create user"
      );
    }
  }

  /**
   * Verify user's email address
   */
  async sendEmailVerification(uid: string) {
    try {
      // Generate email verification link
      const link = await this.auth.generateEmailVerificationLink(
        (await this.auth.getUser(uid)).email!
      );

      return {
        success: true,
        verificationLink: link,
      };
    } catch (error) {
      console.error("Error sending email verification:", error);
      throw new Error("Failed to send email verification");
    }
  }

  /**
   * Verify Firebase ID token
   */
  async verifyIdToken(idToken: string) {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return {
        success: true,
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
    } catch (error) {
      console.error("Error verifying ID token:", error);
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Create or update user from Google Sign-In
   */
  async handleGoogleSignIn({
    uid,
    email,
    displayName,
    photoURL,
  }: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }) {
    try {
      const userRef = this.db.collection("users").doc(uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // Create new user document with free tier
        await userRef.set({
          uid,
          email,
          displayName,
          photoURL,
          provider: "google",
          subscription: {
            tier: "free",
            status: "active",
            startDate: new Date().toISOString(),
            endDate: null,
          },
          credits: {
            remaining: 3,
            total: 3,
            tier: "free",
            updatedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        console.log(`Created new Google user: ${uid}`);
      } else {
        // Update existing user
        await userRef.update({
          displayName,
          photoURL,
          updatedAt: new Date().toISOString(),
        });

        console.log(`Updated existing Google user: ${uid}`);
      }

      return {
        success: true,
        uid,
        email,
        isNewUser: !userDoc.exists,
      };
    } catch (error) {
      console.error("Error handling Google sign-in:", error);
      throw new Error("Failed to process Google sign-in");
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string) {
    try {
      const userRecord = await this.auth.getUser(uid);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
      };
    } catch (error) {
      console.error("Error getting user:", error);
      throw new Error("User not found");
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(uid: string) {
    try {
      // Delete user from Firebase Auth
      await this.auth.deleteUser(uid);

      // Delete user document from Firestore
      await this.db.collection("users").doc(uid).delete();

      // Delete user's subscriptions
      const subscriptions = await this.db
        .collection("subscriptions")
        .where("userId", "==", uid)
        .get();

      const batch = this.db.batch();
      subscriptions.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      console.log(`Successfully deleted user: ${uid}`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  }

  /**
   * Reset user password (send reset email)
   */
  async sendPasswordResetEmail(email: string) {
    try {
      const link = await this.auth.generatePasswordResetLink(email);
      return {
        success: true,
        resetLink: link,
      };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  }
}
