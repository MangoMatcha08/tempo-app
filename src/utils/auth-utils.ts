
export const getAuthErrorMessage = (error: any) => {
  console.log("Processing error:", error.code);
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
    default:
      return error.message || "An unknown error occurred";
  }
};
