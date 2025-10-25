import { z } from "zod";

// Signup validation schema
export const signupSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password must be less than 100 characters"),
  studentName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional().or(z.literal("")),
  studentId: z.string().trim().max(50, "Student ID must be less than 50 characters").optional().or(z.literal("")),
  mobileNo: z.string().trim().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits").optional().or(z.literal("")),
  roomNumber: z.string().trim().max(20, "Room number must be less than 20 characters").optional().or(z.literal("")),
  gender: z.enum(["male", "female", ""]).optional(),
});

// Order submission validation schema
export const orderFormSchema = z.object({
  studentName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  studentId: z.string().trim().max(50, "Student ID must be less than 50 characters").optional().or(z.literal("")),
  mobileNo: z.string().trim().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
  student_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  mobile_no: z.string().trim().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  student_id: z.string().trim().max(50, "Student ID must be less than 50 characters"),
  room_number: z.string().trim().max(20, "Room number must be less than 20 characters"),
  gender: z.enum(["male", "female", ""], { errorMap: () => ({ message: "Invalid gender selection" }) }),
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type OrderFormData = z.infer<typeof orderFormSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
