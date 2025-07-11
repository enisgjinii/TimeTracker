import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.initializeAuthState();
    }

    // Initialize auth state listener
    initializeAuthState() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.notifyAuthStateListeners(user);
            
            if (user) {
                console.log('User is signed in:', user.email);
                this.createUserProfile(user);
            } else {
                console.log('User is signed out');
            }
        });
    }

    // Sign up with email and password
    async signUp(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update profile with display name
            await updateProfile(user, {
                displayName: displayName
            });

            // Create user profile in Firestore
            await this.createUserProfile(user);
            
            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    // Sign out
    async signOut() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    // Create user profile in Firestore
    async createUserProfile(user) {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'User',
                    createdAt: new Date(),
                    lastLogin: new Date(),
                    settings: {
                        theme: 'light',
                        notifications: true,
                        autoSave: true
                    }
                });
            } else {
                // Update last login
                await setDoc(userRef, {
                    lastLogin: new Date()
                }, { merge: true });
            }
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Add auth state listener
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        // Call immediately with current state
        if (this.currentUser !== undefined) {
            callback(this.currentUser);
        }
    }

    // Notify all auth state listeners
    notifyAuthStateListeners(user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    // Get user-friendly error messages
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/operation-not-allowed': 'This operation is not allowed.',
            'auth/invalid-credential': 'Invalid credentials.',
            'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.'
        };
        
        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }
}

// Create and export a single instance
const authService = new AuthService();
export default authService; 