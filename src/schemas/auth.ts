
import * as z from "zod";

export const signInSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
