
export const getAuthErrorMessage = (error: any) => {
  console.log("Processing error:", error.code, error);
  const errorCode = error.code;
  
  switch (errorCode) {
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password";
    case "auth/email-already-in-use":
      return "Email is already in use";
    case "auth/weak-password":
      return "Password is too weak";
    case "auth/invalid-email":
      return "Invalid email format";
    case "auth/too-many-requests":
      return "Too many attempts, please try again later";
    case "auth/network-request-failed":
      return "Network error, please check your connection";
    case "auth/popup-closed-by-user":
      return "Sign in was cancelled. Please try again.";
    case "auth/popup-blocked":
      return "Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.";
    case "auth/cancelled-popup-request":
      return "The authentication request was cancelled. Please try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with the same email but different sign-in credentials. Try signing in using a different method.";
    default:
      return error.message || "An unknown error occurred";
  }
};
