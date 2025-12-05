import { z } from "zod";

// Phone validation helper - validates Indian phone numbers
// Accepts: 10 digits, or +91 followed by 10 digits
// Sanitizes and normalizes to consistent format
const phoneValidation = z.string()
  .trim()
  .transform(val => val.replace(/[^0-9+]/g, '')) // Remove non-numeric except +
  .refine(val => /^\d{10}$/.test(val) || /^\+91\d{10}$/.test(val), {
    message: "Phone must be 10 digits or +91 followed by 10 digits"
  })
  .transform(val => val.startsWith('+91') ? val.slice(3) : val); // Normalize to 10 digits for storage

// Optional phone validation for signup
const optionalPhoneValidation = z.string()
  .trim()
  .transform(val => val.replace(/[^0-9+]/g, ''))
  .refine(val => val === '' || /^\d{10}$/.test(val) || /^\+91\d{10}$/.test(val), {
    message: "Phone must be 10 digits or +91 followed by 10 digits"
  })
  .transform(val => {
    if (val === '') return '';
    return val.startsWith('+91') ? val.slice(3) : val;
  })
  .optional()
  .or(z.literal(""));

// Signup validation schema
export const signupSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password must be less than 100 characters"),
  studentName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional().or(z.literal("")),
  studentId: z.string().trim().max(50, "Student ID must be less than 50 characters").optional().or(z.literal("")),
  mobileNo: optionalPhoneValidation,
  roomNumber: z.string().trim().max(20, "Room number must be less than 20 characters").optional().or(z.literal("")),
  gender: z.enum(["male", "female", ""]).optional(),
});

// Order submission validation schema
export const orderFormSchema = z.object({
  studentName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  studentId: z.string().trim().max(50, "Student ID must be less than 50 characters").optional().or(z.literal("")),
  mobileNo: phoneValidation,
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
  student_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  mobile_no: phoneValidation,
  student_id: z.string().trim().max(50, "Student ID must be less than 50 characters"),
  room_number: z.string().trim().max(20, "Room number must be less than 20 characters"),
  gender: z.enum(["male", "female", ""], { errorMap: () => ({ message: "Invalid gender selection" }) }),
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type OrderFormData = z.infer<typeof orderFormSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
